// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IGlucoseFeed {
    struct Observation {
        uint8 val;
        uint16 deltaTime;
    }

    // function bgl() external view returns (uint);
    // function lastUpdatedTime() external view returns (uint);
    function latest() external view returns (uint8 value, uint64 lastUpdatedTime);
    function getHistory() external view returns (IGlucoseFeed.Observation[36] memory values);
}