// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface ISugarRewardsV1 {
    function onGlucoseUpdate(uint _value) external;
}