// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Libraries.
import "../mixins/Owned.sol";
import "../mixins/MixinResolver.sol";
import "../interfaces/IGlucoseFeed.sol";
import "../interfaces/ISugarRewardsV1.sol";
import "../interfaces/IDaobetic.sol";

import "hardhat/console.sol";

// A blood glucose level feed.
contract GlucoseFeed is Owned, MixinResolver, IGlucoseFeed {
    bool public frozen = false;

    // Glucose values are represented using the mmol/L unit.
    // We choose to represent values in the range of 0-25 mmol/L, which
    // maps well onto what glucose monitors (both instantaneous and continuous)
    // are able to represent.
    // 0-25 with single dp of accuracy is 250 values, which fits neatly into a byte.
    // The timestamp is encoded as a uint64.
    History public history;
    IDaobetic public daobetic;

    // Store a compact history of updates so we can render a glucose line
    // in the NFT.
    // Maximum granularity between points is 2h. Any more and we won't interpolate.
    // 2h = 2 * 60 * 60s = 7200
    // ceil(log2(7200)) = 13 bits.
    // Array of points:
    // (uint8 val, uint16 deltaTime)
    // how many in a word? 256 / 22 = 11
    // how many values do we want to store? 
    // roughly 1 value every 5mins, so 12 per hour, for 3h is 36.
    // 36/11 = 3.27 ~= 4 storage slots
    // we have the uint24 which is a defined type, uint22 isn't.
    // let's just use that.
    // ok so uint24 is an observation.
    // how many do we store now? 
    // 
    // 24 bits per observation
    // 36 observations = 864
    // uint8 latest index 
    // uint64 latest time
    // = update max 2 words per update

    uint8 constant MAX_OBSERVATIONS = 36;

    struct History {
        uint8 latestIndex;
        uint64 latestUpdateTime;
        bool initialized;
        Observation[MAX_OBSERVATIONS] observations;
    }
    struct Observation {
        uint8 val;
        uint16 deltaTime;
    }

    event Update(uint8 value, uint64 timestamp);

    constructor(address _owner, address _resolver) 
        Owned(_owner) 
        MixinResolver(_resolver)
    {}

    function initialize(IDaobetic _daobetic) external {
        daobetic = _daobetic;
    }

    function resolverAddressesRequired() public override pure returns (bytes32[] memory addresses) {
        bytes32[] memory requiredAddresses = new bytes32[](1);
        requiredAddresses[0] = bytes32("SugarRewards");
        return requiredAddresses;
    }

    function sugarRewards() internal view returns (ISugarRewardsV1) {
        return ISugarRewardsV1(requireAndGetAddress(bytes32("SugarRewards"))); // TODO
    }

    function freeze() external onlyOwner {
        frozen = true;
    }

    function pushToHistory(uint8 value, uint64 timestamp, uint64 lastUpdatedTime) internal {
        require(timestamp > lastUpdatedTime, "invalid ordering");
        Observation memory observation;
        observation.val = value;
        observation.deltaTime = uint16(timestamp - lastUpdatedTime);
        history.latestIndex = uint8((history.latestIndex + 1) % MAX_OBSERVATIONS);
        history.observations[history.latestIndex] = observation;
    }

    function getHistory() public view returns (Observation[36] memory values) {
        uint8 j = 0;

        // Go backwards through array.
        uint8 i = history.latestIndex;
        do {
            Observation storage observation = history.observations[i];
            values[j] = observation;
            unchecked {
                // Loop back around starting at the MAX_OBSERVATIONS index.
                // We can't use `history.observations.length` here (TODO: why?).
                i = i == 0 ? (MAX_OBSERVATIONS - 1) : i - 1;
            }
            j++;
        } while(i != history.latestIndex);

        return values;
    }

    function latest() public view returns (uint8 value, uint64 lastUpdatedTime) {
        value = history.observations[history.latestIndex].val;
        lastUpdatedTime = history.latestUpdateTime;
    }

    function post(uint8 _value, uint64 _timestamp) external onlyOwner {
        require(!frozen, "feed frozen");

        (, uint64 lastUpdatedTime) = latest();

        if(_timestamp > lastUpdatedTime) {
            pushToHistory(_value, _timestamp, history.latestUpdateTime);
            history.latestUpdateTime = _timestamp;

            // sugarRewards().onGlucoseUpdate(_value);
        }

        // Allow ingestion of old data, even if it was not an update.
        emit Update(_value, _timestamp);
    }

    // Backfill the observations array with data.
    function backfill(bytes[] calldata _values) external onlyOwner {
        require(!frozen, "feed frozen");
        
        uint64 lastTimestamp = 0;
        for(uint i = 0; i < _values.length; i++) {
            (uint8 value, uint64 timestamp) = abi.decode(_values[i], (uint8, uint64));
            pushToHistory(value, timestamp, lastTimestamp);
            lastTimestamp = timestamp;
            emit Update(value, timestamp);
        }
    }
}