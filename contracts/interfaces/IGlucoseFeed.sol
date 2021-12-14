// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IGlucoseFeed {
    // function bgl() external view returns (uint);
    // function lastUpdatedTime() external view returns (uint);
    function latest() external view returns (uint8 value, uint64 lastUpdatedTime);
}