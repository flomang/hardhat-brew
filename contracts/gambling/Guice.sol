// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Guice is Initializable, OwnableUpgradeable {
    mapping(address => Wager) public wagers;
    
    struct Wager {
        uint256 amount;
        string description;
        address fromAddress;
    }

    event WagerCreated(address fromAdress, string description, uint256 amount);

    constructor() {
    }

    function initialize() public initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    function createWager(string memory _description) public payable {
        Wager memory wager = Wager({
            amount: msg.value,
            description: _description,
            fromAddress: msg.sender
        });
        wagers[msg.sender] = wager;

        emit WagerCreated(msg.sender, _description, msg.value);
    }
}
