// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Guice is Initializable, OwnableUpgradeable {

    struct Wager {
        uint256 amount;
        string outcome;
    }

    constructor() {
    }

    function initialize() public initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
    }
}
