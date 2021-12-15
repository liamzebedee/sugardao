// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../interfaces/IGlucoseFeed.sol";
import "../interfaces/IDaobetic.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/SafeDecimalMath.sol";
import "../libraries/Base64.sol";
import "../libraries/Utils.sol";
import "../mixins/MixinResolver.sol";
import "../mixins/Owned.sol";
import "./GlucoseFeed.sol";


contract Daobetic is Owned, MixinResolver, ERC721, IDaobetic {
    using SafeDecimalMath for uint;
    using Utils for uint;
    using StringUtils for string;

    // ========== CONSTANTS ==========
    uint public constant UNIT = 1e18;
    

    // ========== STATE VARIABLES ==========
    
    // The targets for the diabetic, in mmol/L.
    // These are set in governance with the sugardao. 
    uint public bgHighUpperBound = 18 * 1e18;
    uint public bgLowUpperBound = 5 * 1e18;
    uint public bgLowLowerBound = 0 * 1e18;
    uint public targetBg = 7 * 1e18;

    IGlucoseFeed public glucoseFeed;

    modifier onlyGov() {
        // require(msg.sender == sugardao.eth);
        _;
    }

    constructor(address _owner, address _resolver) 
        Owned(_owner) 
        MixinResolver(_resolver)
        ERC721("Daobetic", "DAOBETIC") 
    {
        _mint(msg.sender, 420);
    }

    function setParameters(uint[4] memory bounds) external {
        bgHighUpperBound = bounds[0];
        bgLowUpperBound = bounds[1];
        bgLowLowerBound = bounds[2];
        targetBg = bounds[3];
    }

    function setFeed(address _newFeed) external onlyGov {
        glucoseFeed = IGlucoseFeed(_newFeed);
    }

    // simple scoring function.
    // TODO: x^(5/e)
    function score(uint _bgl) public view returns (uint) {
        uint f;

        if(_bgl > targetBg) {
            f = (SafeDecimalMath.dist(_bgl, targetBg).divideDecimalRound(bgHighUpperBound - targetBg));
        }
        
        if(_bgl <= targetBg) {
            f = (SafeDecimalMath.dist(_bgl, targetBg).divideDecimalRound(bgLowUpperBound));
        }

        return (UNIT).floorsub(f);
    }

    // Used to claim SUGAR rewards.
    // Can be used for other tokens.
    function claim(address _erc20, uint _amount) external onlyOwner {
        // IERC20(_erc20).transfer(this.ownerOf(tokenId), _amount);
    }

    function getGlucose() internal view returns (string memory) {
        (uint8 glucoseValue, uint64 ts) = glucoseFeed.latest();
        // Convert to a decimal rep.
        uint a = glucoseValue / 10;
        uint b = glucoseValue % 10;
        
        uint ago;
        if(block.timestamp > ts) {
            ago = (block.timestamp - ts) / 60; // mins ago
        } else {
            ago = 1;
        }
        
        return string(abi.encodePacked(Utils.toString(a), ".", Utils.toString(b), " mmol/L", " (", Utils.toString(ago), " mins ago)"));
    }

    function getGlucoseLine() internal view returns (string memory d) {
        IGlucoseFeed.Observation[36] memory points = glucoseFeed.getHistory();
        uint64 time = 0;
        uint64 timeMax = 60*60*3;
        uint64 axisMax = 350;

        d = d
            .concat("M ")
            .concat(Utils.toString(time))
            .concat(",")
            .concat(Utils.toString(points[0].val));
        
        for(uint i = 1; i < points.length; i++) {
            if(points[i].val == 0) {
                // Special case: glucose data is not complete yet.
                continue;
            }

            time += points[i].deltaTime * axisMax / timeMax;
            d = d
                .concat(" L ")
                .concat(Utils.toString(time))
                .concat(" ")
                .concat(Utils.toString(points[i].val));
        }
    }

    function tokenURI(uint256 tokenId) override public view returns (string memory) {
        string[17] memory parts;
        parts[0] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';
        
        parts[1] = string(abi.encodePacked("daobetic #", Utils.toString(tokenId)));

        parts[2] = '</text><text x="10" y="40" class="base">';

        parts[3] = getGlucose();

        parts[4] = string(abi.encodePacked('</text><g transform="translate(10 60)"><path fill="none" stroke="steelblue" stroke-width="1.5" d="', getGlucoseLine() ,'"></path></g>'));

        // parts[5] = getHead(tokenId);

        // parts[6] = '</text><text x="10" y="80" class="base">';

        // parts[7] = getWaist(tokenId);

        // parts[8] = '</text><text x="10" y="100" class="base">';

        // parts[9] = getFoot(tokenId);

        // parts[10] = '</text><text x="10" y="120" class="base">';

        // parts[11] = getHand(tokenId);

        // parts[12] = '</text><text x="10" y="140" class="base">';

        // parts[13] = getNeck(tokenId);

        // parts[14] = '</text><text x="10" y="160" class="base">';

        // parts[15] = getRing(tokenId);

        parts[16] = '</svg>';

        string memory output = string(abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8]));
        output = string(abi.encodePacked(output, parts[9], parts[10], parts[11], parts[12], parts[13], parts[14], parts[15], parts[16]));
        
        string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "Daobetic #', Utils.toString(tokenId), '", "description": "My broken pancreas - your NFT. Own a stake of diabetes. Get exposure to SUGAR and receive rewards based on my performance.", "image": "data:image/svg+xml;base64,', Base64.encode(bytes(output)), '"}'))));
        output = string(abi.encodePacked('data:application/json;base64,', json));

        return output;
    }
}