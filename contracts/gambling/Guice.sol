// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Guice is Initializable, OwnableUpgradeable {
    mapping(address => Wager) public wagers;
    
    struct Wager {
        uint256 player1Amount;
        uint256 player2Amount;
        string description;
        address player1Address;
        address player2Address;
    }

    event WagerCreated(address fromAdress, string description, uint256 amount);
    event WagerAccepted(address fromAdress, string description, uint256 amount);

    constructor() {
    }

    function initialize() public initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    function createWager(string memory _description) public payable {
        require(msg.value > 0, "wager amount must be greater than 0");

        Wager memory wager;
        wager.player1Address = msg.sender;
        wager.player1Amount = msg.value;
        wager.description = _description;

        wagers[msg.sender] = wager;

        emit WagerCreated(msg.sender, _description, msg.value);
    }

    function acceptWager(address other) public payable {
        require(msg.value > 0, "wager amount must be greater than 0");

        Wager storage wager = wagers[other];
        require(msg.value < wager.player1Amount, "wager must be less than player1 amount");

        wager.player2Address = msg.sender;
        wager.player2Amount = msg.value;

        emit WagerAccepted(msg.sender, wager.description, msg.value);
    }
}
