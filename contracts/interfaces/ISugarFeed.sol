pragma solidity ^0.5.16;

interface ISugarFeed {
    function bgl() external view returns (uint);
    function lastUpdatedTime() external view returns (uint);
}