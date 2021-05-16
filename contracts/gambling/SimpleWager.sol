// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SimpleWager is Initializable, OwnableUpgradeable {
    mapping(uint256 => Wager) public wagers;
    uint256 public wagersCreated;

    enum WagerStatus {CANCELLED, PENDING_ACCEPT, IN_PLAY, SETTLED, FORFEITED, ABORTED, TERMINATED}

    struct WagerClaim {
        address player;
        bool result;
        bool submitted;
        uint256 amount;
        uint256 blockNumber;
    }

    struct Wager {
        uint256 wagerID;
        string description;
        WagerStatus status;
        WagerClaim maker;
        WagerClaim taker;
    }

    event WagerCreated(
        uint256 wagerID,
        address makerAddress,
        string description,
        uint256 amount,
        uint256 atBlock
    );
    event WagerCancelled(uint256 wagerID, uint256 atBlock);
    event WagerAccepted(
        uint256 wagerID,
        address takerAddress,
        string description,
        uint256 amount,
        uint256 atBlock
    );
    event WagerSettled(address winner, uint256 winnings, uint256 atBlock);
    event WagerForfeited(
        uint256 wagerID,
        uint256 amountForfeited,
        bool makerResult,
        bool takerResult,
        uint256 atBlock
    );
    event WagerClaimSubmitted(uint256 wagerID, address player, bool result, uint256 atBlock);
    event WagerAborted(uint256 wagerID, uint256 atBlock);
    event WagerTerminated(uint256 wagerID, uint256 atBlock);

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

        wager.maker = WagerClaim({
            result: false,
            submitted: false,
            player: msg.sender,
            amount: msg.value,
            blockNumber: block.number
        });

        // map wager ID to the wager object
        wagers[wager.wagerID] = wager;

        emit WagerCreated({
            wagerID: wager.wagerID,
            makerAddress: msg.sender,
            description: _description,
            amount: msg.value,
            atBlock: block.number
        });
    }

    function cancelWager(uint256 wagerID) public {
        Wager storage wager = wagers[wagerID];

        // only pending wagers can be cancelled
        require(
            wager.status == WagerStatus.PENDING_ACCEPT,
            "the wager cannot be cancelled because it is in play"
        );
        require(wager.maker.player == msg.sender, "no bueno");

        // in theory this combined with the require statement above should guard against re-entry
        wager.status = WagerStatus.CANCELLED;

        // return the original amount wagered
        (bool success, ) =
            wager.maker.player.call{value: wager.maker.amount}("");
        require(success, "Transfer failed.");

        emit WagerCancelled({wagerID: wagerID, atBlock: block.number});
    }

    function acceptWager(uint256 _wagerID) public payable {
        Wager storage wager = wagers[_wagerID];

        // required accept amount should be equal to maker amount 
        require(msg.value == wager.maker.amount, "wager amount must be the same");

        // only pending wagers can be accepted
        require(
            wager.status == WagerStatus.PENDING_ACCEPT,
            "the wager is no longer available"
        );

        wager.status = WagerStatus.IN_PLAY;
        wager.taker = WagerClaim({
            result: false,
            submitted: false,
            player: msg.sender,
            amount: msg.value,
            blockNumber: block.number
        });

        emit WagerAccepted({
            wagerID: _wagerID,
            takerAddress: msg.sender,
            description: wager.description,
            amount: msg.value,
            atBlock: block.number
        });
    }

    function settleWager(Wager storage wager) internal {
        uint256 wagerTotal = wager.maker.amount + wager.taker.amount;

        // a wager is settled when both maker and taker results agree
        if (wager.taker.result == wager.maker.result) {
            wager.status = WagerStatus.SETTLED;

            address payee = (wager.maker.result? wager.maker.player : wager.taker.player);

            (bool success, ) = payee.call{value: wagerTotal}("");
            require(success, "reward player failed");
            emit WagerSettled({
                winner: payee,
                winnings: wagerTotal,
                atBlock: block.number
            });

        } else {
            // the wager if forfeited if both disagree on the outcome
            wager.status = WagerStatus.FORFEITED;

            // TODO send the remaining amount to an address pool for charity

            emit WagerForfeited({
                wagerID: wager.wagerID,
                amountForfeited: wagerTotal,
                makerResult: wager.maker.result,
                takerResult: wager.taker.result,
                atBlock: block.number
            });
        }
    }

    function submitResult(uint256 _wagerID, bool _result) public {
        Wager storage wager = wagers[_wagerID];

        // only pending wagers can be accepted
        require(
            wager.status == WagerStatus.IN_PLAY,
            "the wager must be in play"
        );
        require(
            wager.maker.player == msg.sender ||
                wager.taker.player == msg.sender,
            "only players of this wager can settle"
        );

        if (wager.maker.player == msg.sender) {
            wager.maker.result = _result;
            wager.maker.submitted = true;

            if (wager.taker.submitted) {
                settleWager(wager);
            }
        } else if (wager.taker.player == msg.sender) {
            wager.taker.result = _result;
            wager.taker.submitted = true;

            if (wager.maker.submitted) {
                settleWager(wager);
            }
        }

        emit WagerClaimSubmitted(_wagerID, msg.sender, _result, block.number);
    }

    function terminate(uint256 _wagerID) public onlyOwner {
        Wager storage wager = wagers[_wagerID];
        wager.status = WagerStatus.TERMINATED;

        (bool success, ) =
            wager.maker.player.call{value: wager.maker.amount}("");
        require(success, "refund maker failed");

        (success, ) =
            wager.taker.player.call{value: wager.taker.amount}("");
        require(success, "refund taker failed");

        emit WagerTerminated({wagerID: _wagerID, atBlock: block.number});
    }

    // players can abort within 7 blocks of taker block number
    function abort(uint256 _wagerID) public {
        Wager storage wager = wagers[_wagerID];

        // can only be done by maker or taker
        require(
            wager.maker.player == msg.sender ||
                wager.taker.player == msg.sender,
            "no bueno"
        );

        // must be still in play
        require(
            wager.status == WagerStatus.IN_PLAY, 
            "the wager must still be in play"
        );
      
        // only if maker and taker both have not submitted
        require(
            !wager.taker.submitted && !wager.maker.submitted, 
            "results have been submitted"
        );

        // can only abort when within 7 blocks of taker's block number 
        require(
            block.number - wager.taker.blockNumber <= 7, 
            "abort window must be within 7 blocks"
        );

        wager.status = WagerStatus.ABORTED;

        (bool success, ) =
            wager.maker.player.call{value: wager.maker.amount}("");
        require(success, "refund maker failed");

        (success, ) =
            wager.taker.player.call{value: wager.taker.amount}("");
        require(success, "refund taker failed");

        emit WagerAborted({wagerID: _wagerID, atBlock: block.number});
    }
}
