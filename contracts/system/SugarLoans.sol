pragma solidity ^0.5.16;

import "../lib/SafeDecimalMath.sol";
import "../mixins/MixinResolver.sol";
import "../mixins/Owned.sol";
import "../interfaces/ISugarOracle.sol";
import "../interfaces/IERC20.sol";
import "openzeppelin-solidity-2.3.0/contracts/math/SafeMath.sol";
import "hardhat/console.sol";
import "../tokens/DIA.sol";

contract SugarLoans is Owned, MixinResolver {
    using SafeMath for uint;
    using SafeDecimalMath for uint;

    /* ========== ADDRESS RESOLVER CONFIGURATION ========== */
    bytes32 private constant CONTRACT_SUGAR_ORACLE = "SugarOracle";
    bytes32 private constant CONTRACT_DIA_TOKEN = "DIA";
    bytes32 private constant CONTRACT_INVERSE_DIA_TOKEN = "iDIA";
    bytes32 private constant CONTRACT_SUGAR_TOKEN = "SUGAR";

    // ========== CONSTANTS ==========
    uint public constant UNIT = 1e18;

    // ========== STATE ==========s
    struct Loan {
        uint collateral; // SUGAR
        uint longDebt; // DIA
        uint shortDebt; // iDIA
    }
    mapping(address => Loan) loans;

    constructor(address _owner, address _resolver) 
        public 
        Owned(_owner) 
        MixinResolver(_resolver)
    {}

    function initialize() public {}

    // ========== VIEWS ==========

    function resolverAddressesRequired() public view returns (bytes32[] memory addresses) {
        bytes32[] memory newAddresses = new bytes32[](4);
        newAddresses[0] = CONTRACT_SUGAR_ORACLE;
        newAddresses[1] = CONTRACT_DIA_TOKEN;
        newAddresses[2] = CONTRACT_INVERSE_DIA_TOKEN;
        newAddresses[3] = CONTRACT_SUGAR_TOKEN;
        return newAddresses;
    }

    function sugarOracle() internal view returns (ISugarOracle) {
        return ISugarOracle(requireAndGetAddress(CONTRACT_SUGAR_ORACLE));
    }

    function diaToken() internal view returns (DIA) {
        return DIA(requireAndGetAddress(CONTRACT_DIA_TOKEN));
    }

    function inverseDiaToken() internal view returns (DIA) {
        return DIA(requireAndGetAddress(CONTRACT_INVERSE_DIA_TOKEN));
    }

    function sugarToken() internal view returns (IERC20) {
        return IERC20(requireAndGetAddress(CONTRACT_SUGAR_TOKEN));
    }

    // 
    // Loan helpers
    // 

    function minCRatio() internal pure returns (uint) {
        return 100 * UNIT / 100; // 100%
    }
    function liquidationCRatio() internal pure returns (uint) {
        return 80 * UNIT / 100; // 100%
    }
    
    function collateralisation(address account) public view returns (uint cRatio) {
        Loan storage loan = loans[account];
        (uint longPrice, uint shortPrice) = sugarOracle().getPrices();
        
        // Check c-ratio.
        uint collateral = loan.collateral.multiplyDecimal(UNIT);
        // Calculate debt.
        uint debt;
        debt = debt.add(loan.longDebt.multiplyDecimal(longPrice));
        debt = debt.add(loan.shortDebt.multiplyDecimal(shortPrice));

        if(debt != 0) {
            cRatio = collateral.divideDecimal(debt);
        }
    }

    // ========== MUTATIVE FUNCTIONS ==========
    
    function deposit(uint amount) public {
        require(sugarToken().balanceOf(msg.sender) >= amount, "ERR_BALANCE");
        require(sugarToken().allowance(msg.sender, address(this)) >= amount, "ERR_ALLOWANCE");
        sugarToken().transferFrom(msg.sender, address(this), amount);

        address account = msg.sender;
        Loan storage loan = loans[msg.sender];
        loan.collateral = loan.collateral.add(amount);
        emit Deposit(account, amount);
    }

    function borrow(bool direction, uint amount) public {
        _borrow(msg.sender, direction, amount);
    }

    function _borrow(address account, bool borrowLong, uint amount) public {
        Loan storage loan = loans[account];
        (uint longPrice, uint shortPrice) = sugarOracle().getPrices();

        // Check c-ratio.
        uint collateral = loan.collateral.multiplyDecimal(UNIT);
        // Calculate debt.
        uint debt;
        debt = debt.add(loan.longDebt.multiplyDecimal(longPrice));
        debt = debt.add(loan.shortDebt.multiplyDecimal(shortPrice));
        debt = debt.add(amount.multiplyDecimal(borrowLong ? longPrice : shortPrice));

        uint newCRatio;
        if(debt != 0) {
            newCRatio = collateral.divideDecimal(debt);
        }
        
        // console.log(newCRatio);
        require(newCRatio >= minCRatio(), "ERR_C_RATIO");

        // Mint the token.
        (borrowLong ? diaToken() : inverseDiaToken()).issue(account, amount);

        emit Borrow(account, borrowLong, amount);
    }

    // direction: 0 for short, 1 for long
    function open(bool direction, uint amount) external {
        deposit(amount);
        borrow(direction, amount);
    }
    
    function liquidate(address account) external {
        Loan storage loan = loans[account];
        
        // Check cRatio.
        uint cRatio = collateralisation(account);
        require(cRatio <= liquidationCRatio(), "ERR_C_RATIO");
        
        // Sell collateral.
        // 25% to liquidator.
        address liquidator = msg.sender;
        uint collateralAmount = loan.collateral;
        sugarToken().transfer(liquidator, loan.collateral.multiplyDecimal(100).divideDecimal(25));
        sugarToken().transfer(liquidator, loan.collateral.multiplyDecimal(100).divideDecimal(75));
        // 75% to right side of market.
        // TODO: let's try out something like an LPRewards contract here. 
        // Keep track of each user's cumulative holdings of (DIA, iDIA),
        // distribute rewards to holders of either, and allow users to claim
        // sugarToken().transfer(liquidator, loan.collateral.multiplyDecimal(100).divideDecimal(25));

        // Liquidate.
        loan.collateral = 0;
        loan.longDebt = 0;
        loan.shortDebt = 0;

        emit Liquidated(account, cRatio, liquidator, collateralAmount);
    }

    event Deposit(address account, uint amount);
    event Borrow(address account, bool long, uint amount);
    event Liquidated(address account, uint cRatio, address liquidator, uint collateralAmount);
}

