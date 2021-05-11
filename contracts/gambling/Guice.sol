// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Guice is Initializable, OwnableUpgradeable {
    mapping(uint256 => Wager) public wagers;
    uint256 public wagersCreated;

    enum WagerStatus{ CANCELLED, PENDING_ACCEPT, IN_PLAY, SETTLED}

    struct WagerClaim {
        address player;
        bool result;
        bool submitted;
        uint256 amount;
    }

    struct Wager {
        uint256 wagerID;
        string description;
        WagerStatus status;
        WagerClaim maker;
        WagerClaim taker;
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
        wager.description = _description;
        wager.status = WagerStatus.PENDING_ACCEPT;

        wager.maker = WagerClaim({result: false, submitted: false, player: msg.sender, amount: msg.value});

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
        (bool success,) = wager.maker.player.call{value:wager.maker.amount}("");
        require(success, "Transfer failed.");

        emit WagerCancelled(wagerID);
    }

    function acceptWager(uint256 _wagerID) public payable {
        // required accept amount should be non zero 
        require(msg.value > 0, "wager amount must be greater than 0");

        Wager storage wager = wagers[_wagerID];

        // the sent amount must be less than or equal to the original wagered amount
        require(msg.value <= wager.maker.amount, "wager must be less than player1 amount");

        // only pending wagers can be accepted
        require(wager.status == WagerStatus.PENDING_ACCEPT, "the wager is no longer available");

        wager.status = WagerStatus.IN_PLAY;
        wager.taker =  WagerClaim({result: false, submitted: false, player: msg.sender, amount: msg.value}); 

        emit WagerAccepted(_wagerID, msg.sender, wager.description, msg.value);
    }

    function settleWager(uint256 _wagerID, bool _result) public {
        Wager storage wager = wagers[_wagerID];
    
        // only pending wagers can be accepted
        require(wager.status == WagerStatus.IN_PLAY, "the wager must be in play");
        require(wager.maker.player == msg.sender || wager.taker.player == msg.sender, "only players of this wager can settle");

        if (wager.maker.player == msg.sender) {
            wager.maker.result = _result;
            wager.maker.submitted = true;

            if (wager.taker.submitted) {
                console.log("settle");
                wager.status = WagerStatus.SETTLED;
            }
        } else if (wager.taker.player == msg.sender) {
            wager.taker.result = _result;
            wager.taker.submitted = true;

            if (wager.taker.submitted) {
                console.log("settle");
                wager.status = WagerStatus.SETTLED;
            }
        }
    }
}
