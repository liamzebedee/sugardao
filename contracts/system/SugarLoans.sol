pragma solidity ^0.5.16;

import "../lib/SafeDecimalMath.sol";
import "../mixins/MixinResolver.sol";
import "../mixins/Owned.sol";
import "../interfaces/ISugarOracle.sol";
import "../interfaces/IERC20.sol";

contract SugarLoans is Owned, MixinResolver {
    using SafeDecimalMath for uint;

    /* ========== ADDRESS RESOLVER CONFIGURATION ========== */
    bytes32 private constant CONTRACT_SUGAR_ORACLE = "SugarOracle";
    bytes32 private constant CONTRACT_DIA_TOKEN = "DIA";
    bytes32 private constant CONTRACT_INVERSE_DIA_TOKEN = "iDIA";
    bytes32 private constant CONTRACT_SUGAR_TOKEN = "SUGAR";

    // ========== CONSTANTS ==========
    uint public constant UNIT = 1e18;

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

    function diaToken() internal view returns (IERC20) {
        return IERC20(requireAndGetAddress(CONTRACT_DIA_TOKEN));
    }

    function inverseDiaToken() internal view returns (IERC20) {
        return IERC20(requireAndGetAddress(CONTRACT_INVERSE_DIA_TOKEN));
    }

    function sugarToken() internal view returns (IERC20) {
        return IERC20(requireAndGetAddress(CONTRACT_SUGAR_TOKEN));
    }

    // ========== MUTATIVE FUNCTIONS ==========

    // direction: 0 for long, 1 for short
    function open(bool direction, uint amount) external {
        require(sugarToken().balanceOf(msg.sender) >= amount, "ERR_BALANCE");
        require(sugarToken().allowance(msg.sender, address(this)) >= amount, "ERR_ALLOWANCE");
        sugarToken().transferFrom(msg.sender, address(this), amount);

        // mint iDIA or DIA
    }
}

