// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../lib/SafeDecimalMath.sol";
import "../mixins/MixinResolver.sol";
import "../mixins/Owned.sol";
import "../interfaces/IGlucoseFeed.sol";
import "../interfaces/ISugarOracle.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Daobetic is ERC721, Ownable {
    using SafeDecimalMath for uint;

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

    constructor(string memory _name, string memory _id, string memory _image) 
        ERC721("Daobetic", "DAOBETIC") 
    {

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
}