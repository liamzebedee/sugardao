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
        bgl = _value;
        lastUpdatedTime = _timestamp;
        emit Update(_value, _timestamp);
    }
}