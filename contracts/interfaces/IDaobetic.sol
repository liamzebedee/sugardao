// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./IGlucoseFeed.sol";

interface IDaobetic {
    function glucoseFeed() external view returns (IGlucoseFeed);
}