// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract AdminBox is Initializable {
    uint256 private value;
    address private admin;

    // Emitted when the stored value changes
    event ValueChanged(uint256 newValue);

    function initialize(address _admin) public initializer {
        admin = _admin;
    }

    // Stores a new value in the contract
    function store(uint256 newValue) public {
        require(msg.sender == admin, "Adminbox: not admin");
        value = newValue;
        emit ValueChanged(newValue);
    }

    // Reads the last stored value
    function retrieve() public view returns (uint256) {
        return value;
    }

    function increment() public {
        value = value + 1;
        emit ValueChanged(value);
    }
}