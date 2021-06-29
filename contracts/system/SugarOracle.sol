import "../lib/SafeDecimalMath.sol";
import "../mixins/MixinResolver.sol";
import "../mixins/Owned.sol";
import "../interfaces/ISugarFeed.sol";
import "../interfaces/ISugarOracle.sol";
import "openzeppelin-solidity-2.3.0/contracts/math/SafeMath.sol";

contract SugarOracle is Owned, MixinResolver, ISugarOracle {
    using SafeMath for uint;
    using SafeDecimalMath for uint;

    /* ========== ADDRESS RESOLVER CONFIGURATION ========== */
    bytes32 private constant CONTRACT_SUGAR_FEED = "SugarFeed";

    // ========== CONSTANTS ==========
    uint public constant UNIT = 1e18;
    
    // TODO: govern these in the SugarDAO
    uint public constant BG_HIGH_UPPER_BOUND = 18 * 1e18;
    uint public constant BG_LOW_HIGHER_BOUND = 5 * 1e18;
    uint public constant BG_LOW_LOWER_BOUND = 0 * 1e18;

    // ========== STATE VARIABLES ==========
    uint public TARGET_BG = 7 * 1e18; // mmol

    constructor(address _owner, address _resolver) 
        public 
        Owned(_owner) 
        MixinResolver(_resolver)
    {}

    function initialize() public {}

    // ========== VIEWS ==========

    function resolverAddressesRequired() public view returns (bytes32[] memory addresses) {
        bytes32[] memory newAddresses = new bytes32[](1);
        newAddresses[0] = CONTRACT_SUGAR_FEED;
        return newAddresses;
    }

    function sugarFeed() internal view returns (ISugarFeed) {
        return ISugarFeed(requireAndGetAddress(CONTRACT_SUGAR_FEED));
    }

    // ========== MUTATIVE FUNCTIONS ==========

    function getPrice() public view returns (uint) {
        return score(sugarFeed().bgl());
    }

    // Get the prices for DIA (long) and iDIA (short).
    function getPrices() public view returns (uint long, uint short) {
        long = getPrice();
        short = (UNIT).sub(long);
    }

    // simple scoring function.
    // TODO: x^(5/e)
    function score(uint _bgl) public view returns (uint) {
        uint f;

        if(_bgl > TARGET_BG) {
            f = (SafeDecimalMath.dist(_bgl, TARGET_BG).divideDecimalRound(BG_HIGH_UPPER_BOUND - TARGET_BG));
        }
        
        if(_bgl <= TARGET_BG) {
            f = (SafeDecimalMath.dist(_bgl, TARGET_BG).divideDecimalRound(BG_LOW_HIGHER_BOUND));
        }

        return (UNIT).floorsub(f);
    }

    // function logisticFn(uint x) public pure returns (int) {
    //     return UNIT.sub(x.pow( (5*UNIT).dividedBy(EULER_CONSTANT) ));
    // }
}

