// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract WeShake is Initializable, OwnableUpgradeable {
    string public terms;
    address payable[] public users;
    mapping(address => Person) public userInfo;

    struct Person {
        string firstName;
        string lastName;
    }

    event NewTermsSet(string terms);
    event PersonAgreed(string firstName, string lastName, address fromAddress);

    // https://forum.openzeppelin.com/t/how-to-use-ownable-with-upgradeable-contract/3336
    function initialize() public initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        terms = "undefined";
    }

    function checkUserExists(address user) internal view returns (bool) {
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] == user) return true;
        }
        return false;
    }

    // anybody can agree to the terms?
    function agree(string memory _firstName, string memory _lastName) public {

        require(!checkUserExists(msg.sender), "you have already agreed to this contract!");
        require(keccak256(abi.encodePacked(terms)) != keccak256(abi.encodePacked("undefined")), "contract terms are undefined");

        address sender = msg.sender;
        Person memory newUser = Person({
            firstName: _firstName,
            lastName: _lastName
        });

        userInfo[sender] = newUser;
        users.push(payable(sender));

        emit PersonAgreed(_firstName, _lastName, sender);
    }

    // the owner is only allowed to set the contract terms
    function setTerms(string memory _terms) public onlyOwner {
        terms = _terms;
        emit NewTermsSet(_terms);
    }
}

