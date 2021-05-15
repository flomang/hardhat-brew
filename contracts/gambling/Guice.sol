// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Guice is Initializable, OwnableUpgradeable {
    mapping(uint256 => Wager) public wagers;
    uint256 public wagersCreated;

    enum WagerStatus {CANCELLED, PENDING_ACCEPT, IN_PLAY, SETTLED, FORFEITED, ABORTED}

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
    event WagerRefunded(uint256 wagerID, uint256 atBlock);

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
        // required accept amount should be non zero
        require(msg.value > 0, "wager amount must be greater than 0");

        Wager storage wager = wagers[_wagerID];

        // the sent amount must be less than or equal to the original wagered amount
        require(
            msg.value <= wager.maker.amount,
            "wager must be less than or equal to the maker amount"
        );

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

        // a wager is settled when both maker and taker results agree
        if (wager.taker.result == wager.maker.result) {
            wager.status = WagerStatus.SETTLED;

            if (wager.maker.result) {
                console.log("the maker won");

                uint256 reward = wager.maker.amount + wager.taker.amount;

                // reward the maker
                (bool success, ) = wager.maker.player.call{value: reward}("");
                require(success, "reward maker failed");

                emit WagerSettled({
                    winner: wager.maker.player,
                    winnings: wager.taker.amount,
                    atBlock: block.number
                });
            } else {
                console.log("the taker won");

                uint256 reward = wager.taker.amount;
                uint256 change = wager.maker.amount - reward;

                // reward the taker and send him back his amount
                (bool success, ) =
                    wager.taker.player.call{value: reward + wager.taker.amount}(
                        ""
                    );
                require(success, "reward maker failed");

                // the taker can only win up to his amount that
                emit WagerSettled({
                    winner: wager.taker.player,
                    winnings: reward,
                    atBlock: block.number
                });

                if (change > 0) {
                    (success, ) = wager.maker.player.call{value: change}("");
                    require(success, "change maker failed");
                }
            }
        } else {
            // the wager if forfeited if both disagree on the outcome
            wager.status = WagerStatus.FORFEITED;

            // both parties lose the wager and the maker is returned any amount that was not bet.
            uint256 change = wager.maker.amount - wager.taker.amount;

            if (change > 0) {
                (bool success, ) = wager.maker.player.call{value: change}("");
                require(success, "change maker failed");
            }

            // TODO send the remaining amount to an address pool for charity

            uint256 forfeited = wager.taker.amount * 2;
            emit WagerForfeited({
                wagerID: wager.wagerID,
                amountForfeited: forfeited,
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
            "refund window has elapsed"
        );

        wager.status = WagerStatus.ABORTED;

        (bool success, ) =
            wager.maker.player.call{value: wager.maker.amount}("");
        require(success, "refund maker failed");

        (success, ) =
            wager.taker.player.call{value: wager.taker.amount}("");
        require(success, "refund taker failed");


        emit WagerRefunded({wagerID: _wagerID, atBlock: block.number});
    }
}
