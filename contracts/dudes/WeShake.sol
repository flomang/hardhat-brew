// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract WeShake is Initializable, OwnableUpgradeable {
    string public terms;
    address payable[] public users;

    mapping(address => Person) public registry;
    Person[] public members; 

    struct Person {
        string name;
        address addr;
        bool agreed;
    }

    event NewTermsSet(string terms);
    event PersonAgreed(string name, address fromAddress);
    event PersonDisagreed(string name, address fromAddress);
    event PersonRegistered(string name, address fromAddress);

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

    function getAllMembers() public view returns (Person[] memory) {
        return members;
    }

    function register(string memory _name) public {
        require(!checkUserExists(msg.sender), "you are already registered");
        address sender = msg.sender;
        Person memory newUser = Person({
            name: _name,
            addr: sender,
            agreed: false 
        });

        members.push(newUser);
        users.push(payable(sender));
        registry[sender] = newUser;
        emit PersonRegistered(_name, sender);
    }

    function agree() public {
        require(checkUserExists(msg.sender), "not registered");
        require(keccak256(abi.encodePacked(terms)) != keccak256(abi.encodePacked("undefined")), "contract terms are undefined");

        Person storage user = registry[msg.sender];
        user.agreed = true;
        emit PersonAgreed(user.name, msg.sender);
    }

    function disagree() public {
        require(checkUserExists(msg.sender), "not registered");
        Person storage user = registry[msg.sender];
        user.agreed = false;
        emit PersonDisagreed(user.name, msg.sender);
    }

    // the owner is only allowed to set the contract terms
    function setTerms(string memory _terms) public onlyOwner {
        terms = _terms;

        // setting new terms sets all members agreed to false
        for (uint256 i = 0; i < members.length; i++) {
            members[i].agreed = false;
        }

        emit NewTermsSet(_terms);
    }
}

