// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Libraries.
import "../mixins/Owned.sol";
import "../mixins/MixinResolver.sol";
import "../interfaces/IGlucoseFeed.sol";
import "../interfaces/ISugarRewardsV1.sol";

import "./Daobetic.sol";

// A blood glucose level feed.
contract GlucoseFeed is Owned, MixinResolver, IGlucoseFeed {
    bool public frozen = false;
    uint public bgl;
    uint public lastUpdatedTime;

    Daobetic public daobetic;

    event Update(uint value, uint timestamp);

    constructor(address _owner, address _resolver) 
        Owned(_owner) 
        MixinResolver(_resolver)
    {}

    function initialize(Daobetic _daobetic) external {
        daobetic = _daobetic;
    }

    function sugarRewards() internal pure returns (ISugarRewardsV1) {
        return ISugarRewardsV1(address(0)); // TODO
    }

    function freeze() external onlyOwner {
        frozen = true;
    }

    function post(uint256 _value, uint _timestamp) external onlyOwner {
        require(!frozen, "feed frozen");

        if(_timestamp > lastUpdatedTime) {
            bgl = _value;
            lastUpdatedTime = _timestamp;
        }

        // Allow ingestion of old data, even if it was not an update.
        emit Update(_value, _timestamp);

        sugarRewards().onGlucoseUpdate(_value);
    }
}