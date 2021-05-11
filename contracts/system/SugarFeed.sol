// Libraries.
import "../lib/SafeDecimalMath.sol";
import "../mixins/Owned.sol";
import "../mixins/MixinResolver.sol";
import "../interfaces/ISugarFeed.sol";

// A blood glucose level feed.
contract SugarFeed is Owned, MixinResolver, ISugarFeed {
    uint public bgl;
    uint public lastUpdatedTime;

    event Update(uint _value);

    constructor(address _owner, address _resolver) 
        public 
        Owned(_owner) 
        MixinResolver(_resolver)
    {}

    function post(uint _value) external onlyOwner {
        bgl = _value;
        lastUpdatedTime = block.timestamp;
        emit Update(_value);
    }
}