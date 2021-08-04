pragma solidity ^0.5.0;

import "openzeppelin-solidity-2.3.0/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity-2.3.0/contracts/token/ERC20/ERC20Detailed.sol";

contract TestToken is ERC20, ERC20Detailed {
    constructor() public ERC20Detailed("Test", "TEST", 18) {}

    function mint(address account, uint amount) public {
        _mint(account, amount);
    }

    function issue(address account, uint amount) public {
        _mint(account, amount);
    } 
}