// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";

contract OpenBet {
    uint256 public minimumBet;
    uint256 public totalBetOne;
    uint256 public totalBetTwo;
    uint256 public numberOfBets;
    uint256 public maxAmountOfBets = 1000;
    bool locked = false;

    address payable[] public players;

    struct Player {
        uint256 amountBet;
        uint16 teamSelected;
    }

    event BetConfirmed(address player, uint256 amount, uint8 teamSelected);
    event PrizeDistributed(uint256 numberOfWinners, uint256 numberOfLosers, uint totalPrize);

    // Address of the player and => the user info
    mapping(address => Player) public playerInfo;

    constructor() {
        minimumBet = 3;
    }

    function checkPlayerExists(address player) public view returns (bool) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == player) return true;
        }
        return false;
    }

    function bet(uint8 _teamSelected) public payable {
        //The first require is used to check if the player already exist
        require(!checkPlayerExists(msg.sender), "you have already placed your wager!");
        //The second one is used to see if the value sended by the player is
        //Higher than the minum value
        require(msg.value >= minimumBet, "value is less than min bet");

        //We set the player informations : amount of the bet and selected team
        playerInfo[msg.sender].amountBet = msg.value;
        playerInfo[msg.sender].teamSelected = _teamSelected;

        //then we add the address of the player to the players array
        players.push(payable(msg.sender));

        //at the end, we increment the stakes of the team selected with the player bet
        if (_teamSelected == 1) {
            totalBetOne += msg.value;
        } else {
            totalBetTwo += msg.value;
        }

        emit BetConfirmed(msg.sender, msg.value, _teamSelected);
    }

    function distributePrizes(uint16 _teamWinner) public {
        require(!locked, "previous distribution in progress");
        require(totalBetOne > 0, "bet one amount is zero");
        require(totalBetTwo > 0, "bet two amount is zero");
        require(checkPlayerExists(msg.sender), "players can distribute prizes");

        address payable[1000] memory winners;
        //We have to create a temporary in memory array with fixed size
        //Let's choose 1000
        uint256 count = 0; // This is the count for the array of winners
        uint256 LoserBet = 0; //This will take the value of all losers bet
        uint256 WinnerBet = 0; //This will take the value of all winners bet
        address add;
        uint256 amountBet;
        address payable playerAddress;
        //We loop through the player array to check who selected the winner team
        for (uint256 i = 0; i < players.length; i++) {
            playerAddress = players[i];
            //If the player selected the winner team
            //We add his address to the winners array
            if (playerInfo[playerAddress].teamSelected == _teamWinner) {
                winners[count] = playerAddress;
                count++;
            }
        }
        //We define which bet sum is the Loser one and which one is the winner
        if (_teamWinner == 1) {
            LoserBet = totalBetTwo;
            WinnerBet = totalBetOne;
        } else {
            LoserBet = totalBetOne;
            WinnerBet = totalBetTwo;
        }
        locked = true;

        //We loop through the array of winners, to give ethers to the winners
        for (uint256 j = 0; j < count; j++) {
            // Check that the address in this fixed array is not empty
            if (winners[j] != address(0)) add = winners[j];
            amountBet = playerInfo[add].amountBet;
            //uint256 amountWon = (amountBet * (10000 + ((LoserBet * 10000) / WinnerBet))) / 10000;
            uint256 amountWon = (amountBet / WinnerBet) * LoserBet;

            //console.log(amountWon);
            //console.log(amountBet);

            //Transfer the money to the user
            //winners[j].transfer(amountBet + amountWon);
        
            (bool success,) = winners[j].call{value:amountBet+amountWon}("");
            require(success, "Transfer failed.");
        }

        emit PrizeDistributed({numberOfWinners: count, numberOfLosers: players.length - count, totalPrize: LoserBet});
        delete playerInfo[playerAddress]; // Delete all the players
        //players.length = 0; // Delete all the players array
        LoserBet = 0; //reinitialize the bets
        WinnerBet = 0;
        totalBetOne = 0;
        totalBetTwo = 0;
        locked = false;
    }

    function AmountOne() public view returns (uint256) {
        return totalBetOne;
    }

    function AmountTwo() public view returns (uint256) {
        return totalBetTwo;
    }
}
