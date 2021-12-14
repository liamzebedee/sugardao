// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface ISugarOracle {
    function getPrice() external view returns (uint);

    // Get the prices for DIA (long) and iDIA (short).
    function getPrices() external view returns (uint long, uint short);

    function score(uint _bgl) external view returns (uint);
}