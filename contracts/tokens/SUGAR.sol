import "openzeppelin-solidity-2.3.0/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity-2.3.0/contracts/token/ERC20/ERC20Mintable.sol";


// import "../interfaces/IERC20.sol";
import "../mixins/Owned.sol";
import "../mixins/MixinResolver.sol";


contract SugarToken is Owned, IERC20, MixinResolver, ERC20Detailed, ERC20Mintable {
    constructor(address _owner, address _resolver) 
        public 
        Owned(_owner) 
        MixinResolver(_resolver) 
        ERC20Detailed("Sugar", "SUGAR", 18)
    {
        _mint(msg.sender, 10**18 * 1000000);
    }
}