pragma solidity ^0.5.16;

// Libraries.
import "../lib/SafeDecimalMath.sol";
import "../mixins/Owned.sol";
import "../mixins/MixinResolver.sol";
import "../interfaces/ISugarFeed.sol";

// A blood glucose level feed.
contract SugarFeed is Owned, MixinResolver, ISugarFeed {
    uint public bgl;
    uint public lastUpdatedTime;

    event Update(uint value, uint timestamp);

    constructor(address _owner, address _resolver) 
        public 
        Owned(_owner) 
        MixinResolver(_resolver)
    {}

    function post(uint256 _value, uint _timestamp) external onlyOwner {
        if(_timestamp > lastUpdatedTime) {
            bgl = _value;
            lastUpdatedTime = _timestamp;
        }

        // Allow ingestion of old data, even if it was not an update.
        emit Update(_value, _timestamp);
    }
}