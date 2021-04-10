// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

contract ERC1155 is ERC1155Upgradeable {
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant THORS_HAMMER = 2;
    uint256 public constant SWORD = 3;
    uint256 public constant SHIELD = 4;

    //constructor() ERC1155("https://game.example/api/item/{id}.json") {
    //    _mint(msg.sender, GOLD, 10**18, "");
    //    _mint(msg.sender, SILVER, 10**27, "");
    //    _mint(msg.sender, THORS_HAMMER, 1, "");
    //    _mint(msg.sender, SWORD, 10**9, "");
    //    _mint(msg.sender, SHIELD, 10**9, "");
    //}

    function initialize() public initializer {
        //console.log("initialize:", msg.sender);
        __ERC1155_init_unchained("");
        _mint(msg.sender, GOLD, 10**18, "");
        _mint(msg.sender, SILVER, 10**27, "");
        _mint(msg.sender, THORS_HAMMER, 1, "");
        _mint(msg.sender, SWORD, 10**9, "");
        _mint(msg.sender, SHIELD, 10**9, "");
    }
}
