pragma solidity ^0.5.16;

import "../interfaces/ISugarOracle.sol";

contract TestSugarOracle is ISugarOracle {
    uint private price;

    function setPrice(uint _price) external {
        price = _price;
    }

    function getPrice() external view returns (uint) {
        return price;
    }

    // Get the prices for DIA (long) and iDIA (short).
    function getPrices() external view returns (uint long, uint short) {
        return (price, 1e18 - price);
    }

    function score(uint _bgl) external view returns (uint) {
        revert("");
    }
}