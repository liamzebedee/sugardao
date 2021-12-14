// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// import "./Daobetic.sol";

// contract SugarRewardsV1 {
//     event Rewarded(address daobetic, uint amount);

//     mapping(address => uint) lastUpdate;

//     constructor(
//         address sugarToken
//     ) public {
//     }

//     function onGlucoseUpdate(address _daobetic, uint _value) external {
//         if(sugarToken().balanceOf(address(this)) == 0) return;

//         // TODO: ACL.
        
//         // Calculate score.
//         Daobetic daobetic = Daobetic(_daobetic);
//         require(address(daobetic.glucoseFeed) == msg.sender, "unauthorised");
//         uint score = daobetic.score(_value);

//         // Mint SUGAR accordingly.
//         uint rewardAmount = 25 ether * score;
//         sugarToken().mint(_daobetic, rewardAmount);

//         emit Rewarded(_daobetic, rewardAmount);
//     }
// }