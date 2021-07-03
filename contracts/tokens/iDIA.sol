pragma solidity ^0.5.16;

import "./ERC20Behaviour.sol";
import "../mixins/Owned.sol";
import "../mixins/MixinResolver.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/ISugarLoans.sol";
import "./ERC20State.sol";

// A stablecoin backed by daobetics.
contract iDIA is Owned, IERC20, ERC20Behaviour, MixinResolver {
    uint8 public constant DECIMALS = 18;

    /* ========== ADDRESS RESOLVER CONFIGURATION ========== */
    bytes32 private constant CONTRACT_SUGAR_LOANS = "SugarLoans";
    
    constructor(
        address payable _proxy,
        ERC20State _tokenState,
        address _owner,
        address _resolver
    ) public
        ERC20Behaviour(
            _proxy,
            _tokenState,
            "Inverse Diabetes",
            "iDIA",
            0,
            DECIMALS,
            _owner
        )
        MixinResolver(_resolver)
    {
    }

    /* ========== VIEWS ========== */

    // Note: use public visibility so that it can be invoked in a subclass
    function resolverAddressesRequired() public view returns (bytes32[] memory addresses) {
        addresses = new bytes32[](1);
        addresses[0] = CONTRACT_SUGAR_LOANS;
        return addresses;
    }

    function sugarLoans() internal view returns (ISugarLoans) {
        return ISugarLoans(requireAndGetAddress(CONTRACT_SUGAR_LOANS));
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function transferFrom(
        address from,
        address to,
        uint value
    ) public optionalProxy returns (bool) {
        return _internalTransferFrom(from, to, value);
    }

    function transfer(address to, uint value) public optionalProxy returns (bool) {
        return super._internalTransfer(messageSender, to, value);
    }

    function issue(address account, uint amount) external onlyInternalContracts {
        _internalIssue(account, amount);
    }

    function burn(address account, uint amount) external onlyInternalContracts {
        _internalBurn(account, amount);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function _internalTransferFrom(
        address from,
        address to,
        uint value
    ) internal returns (bool) {
        // Skip allowance update in case of infinite allowance
        if (tokenState.allowance(from, messageSender) != uint(-1)) {
            // Reduce the allowance by the amount we're transferring.
            // The safeSub call will handle an insufficient allowance.
            tokenState.setAllowance(from, messageSender, tokenState.allowance(from, messageSender).sub(value));
        }

        return super._internalTransfer(from, to, value);
    }

    function _internalIssue(address account, uint amount) internal {
        tokenState.setBalanceOf(account, tokenState.balanceOf(account).add(amount));
        totalSupply = totalSupply.add(amount);
        emitTransfer(address(0), account, amount);
        emitIssued(account, amount);
    }

    function _internalBurn(address account, uint amount) internal returns (bool) {
        tokenState.setBalanceOf(account, tokenState.balanceOf(account).sub(amount));
        totalSupply = totalSupply.sub(amount);
        emitTransfer(account, address(0), amount);
        emitBurned(account, amount);

        return true;
    }

    /* ========== EVENTS ========== */
    event Issued(address indexed account, uint value);
    bytes32 private constant ISSUED_SIG = keccak256("Issued(address,uint256)");

    function emitIssued(address account, uint value) internal {
        proxy._emit(abi.encode(value), 2, ISSUED_SIG, addressToBytes32(account), 0, 0);
    }

    event Burned(address indexed account, uint value);
    bytes32 private constant BURNED_SIG = keccak256("Burned(address,uint256)");

    function emitBurned(address account, uint value) internal {
        proxy._emit(abi.encode(value), 2, BURNED_SIG, addressToBytes32(account), 0, 0);
    }
    
    
    /* ========== MODIFIERS ========== */

    function _isInternalContract(address account) internal view returns (bool) {
        return
            account == address(sugarLoans());
    }

    modifier onlyInternalContracts() {
        require(_isInternalContract(msg.sender), "Only internal contracts allowed");
        _;
    }
}