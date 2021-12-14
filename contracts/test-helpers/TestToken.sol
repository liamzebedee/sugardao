// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() public ERC20("Test", "TEST") {}

    function mint(address account, uint amount) public {
        _mint(account, amount);
    }

    function issue(address account, uint amount) public {
        _mint(account, amount);
    } 
}