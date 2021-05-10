// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Guice is Initializable, OwnableUpgradeable {
    mapping(uint256 => Wager) public wagers;
    uint256 public wagersCreated;

    enum WagerStatus{ CANCELLED, PENDING_ACCEPT, IN_PLAY, SETTLED}
    struct Wager {
        uint256 wagerID;
        address player1Address;
        uint256 player1Amount;
        address player2Address;
        uint256 player2Amount;
        string description;
        WagerStatus status;
    }

    event WagerCreated(uint256 wagerID, address fromAdress, string description, uint256 amount);
    event WagerCancelled(uint256 wagerID);
    event WagerAccepted(uint256 wagerID, address fromAdress, string description, uint256 amount);

    function initialize() public initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        wagersCreated = 0;
    }

    function createWager(string memory _description) public payable {
        require(msg.value > 0, "wager amount must be greater than 0");

        Wager memory wager;
        wager.wagerID = wagersCreated + 1;
        wager.player1Address = msg.sender;
        wager.player1Amount = msg.value;
        wager.description = _description;
        wager.status = WagerStatus.PENDING_ACCEPT;

        // map wager ID to the wager object
        wagers[wager.wagerID] = wager;

        emit WagerCreated(wager.wagerID, msg.sender, _description, msg.value);
    }

    function cancelWager(uint256 wagerID) public {
        Wager storage wager = wagers[wagerID];

        // only pending wagers can be cancelled 
        require(wager.status == WagerStatus.PENDING_ACCEPT, "the wager cannot be cancelled because it is in play");

        // in theory this combined with the require statement above should guard against re-entry
        wager.status = WagerStatus.CANCELLED;

        // return the original amount wagered 
        (bool success,) = wager.player1Address.call{value:wager.player1Amount}("");
        require(success, "Transfer failed.");

        emit WagerCancelled(wagerID);
    }

    function acceptWager(uint256 wagerID) public payable {
        // required accept amount should be non zero 
        require(msg.value > 0, "wager amount must be greater than 0");

        Wager storage wager = wagers[wagerID];

        // the sent amount must be less than or equal to the original wagered amount
        require(msg.value <= wager.player1Amount, "wager must be less than player1 amount");

        // only pending wagers can be accepted
        require(wager.status == WagerStatus.PENDING_ACCEPT, "the wager is no longer available");

        wager.player2Address = msg.sender;
        wager.player2Amount = msg.value;
        wager.status = WagerStatus.IN_PLAY;

        emit WagerAccepted(wagerID, msg.sender, wager.description, msg.value);
    }
}
