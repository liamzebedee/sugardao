// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Libraries.
import "../mixins/Owned.sol";
import "../mixins/MixinResolver.sol";
import "../interfaces/IGlucoseFeed.sol";
import "../interfaces/ISugarRewardsV1.sol";
import "../interfaces/IDaobetic.sol";

// A blood glucose level feed.
contract GlucoseFeed is Owned, MixinResolver, IGlucoseFeed {
    bool public frozen = false;

    // Glucose values are represented using the mmol/L unit.
    // We choose to represent values in the range of 0-25 mmol/L, which
    // maps well onto what glucose monitors (both instantaneous and continuous)
    // are able to represent.
    // 0-25 with single dp of accuracy is 250 values, which fits neatly into a byte.
    // The timestamp is encoded as a uint64.
    uint256 public _latestDatum;
    IDaobetic public daobetic;

    event Update(uint8 value, uint64 timestamp);

    constructor(address _owner, address _resolver) 
        Owned(_owner) 
        MixinResolver(_resolver)
    {}

    function initialize(IDaobetic _daobetic) external {
        daobetic = _daobetic;
    }

    function sugarRewards() internal pure returns (ISugarRewardsV1) {
        return ISugarRewardsV1(address(0)); // TODO
    }

    function freeze() external onlyOwner {
        frozen = true;
    }

    function latest() public view returns (uint8 value, uint64 lastUpdatedTime) {
        return abi.decode(abi.encodePacked(_latestDatum), (uint8, uint64));
    }

    function post(uint8 _value, uint64 _timestamp) external onlyOwner {
        require(!frozen, "feed frozen");

        (, uint64 lastUpdatedTime) = latest();

        if(_timestamp > lastUpdatedTime) {
            _latestDatum = uint256(bytes32(abi.encodePacked(_value, _timestamp)));

            sugarRewards().onGlucoseUpdate(_value);
        }

        // Allow ingestion of old data, even if it was not an update.
        emit Update(_value, _timestamp);
    }

    function backfill(bytes[] calldata _values) external onlyOwner {
        require(!frozen, "feed frozen");
        
        for(uint i = 0; i < _values.length; i++) {
            (uint8 value, uint64 timestamp) = abi.decode(_values[i], (uint8, uint64)); 
            emit Update(value, timestamp);
        }
    }
}