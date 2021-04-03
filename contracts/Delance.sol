// "SPDX-License-Identifier: UNLICENSED"
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

contract Delance {
    
    bool locked = false;
    address payable public employer;
    address payable public freelancer;
    uint public deadline;
    //uint public price;
    
    Request[] public requests;
    
    struct Request {
        string title;
        uint256 amount;
        bool locked;
        bool paid;
    }
    
    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "Only freelancer!");
        _;
    }
    
    modifier onlyEmployer() {
        require(msg.sender == employer, "Only employer!");
        _;
    }
    
    event RequestUnlocked(bool locked);
    event RequestCreated(string title, uint256 amount, bool locked, bool paid);
    event RequestPaid(address receiver, uint256 amount);
    
    constructor(address payable _freelancer, uint _deadline) payable {
        //console.log("Delance constructor freelancer is:", _freelancer);
        //console.log("Delance constructor deadline:", _deadline);

        freelancer = _freelancer;
        deadline = _deadline;
        employer = msg.sender;
        //price = msg.value;
    }
    
    // permits the contract to receive ether
    receive() external payable {
        //console.log("Delance receive:", msg.value);
        //price += msg.value;
    }
    
    function getBalance() public view returns (uint) {
        uint balance = address(this).balance;
        //console.log("Contract balance is:", balance);
        return balance;
    }

    function createRequest(string memory _title, uint256 _amount) public onlyFreelancer {
        uint balance = address(this).balance;
        require(balance >= _amount, "Request amount cannot exceed current contract balance.");

        Request memory request = Request({
            title: _title,
            amount: _amount,
            locked: true,
            paid: false
        });
        
        requests.push(request);
        
        emit RequestCreated(_title, _amount, request.locked, request.paid);
    }
    
    function getAllRequests() public view returns (Request[] memory) {
        return requests;
    }
    
    function unlockRequest(uint256 _index) public onlyEmployer {
        Request storage request = requests[_index];
        require(request.locked, "Already unocked");
        request.locked = false;
        
        emit RequestUnlocked(request.locked);
    }
    
    function payRequest(uint256 _index) public onlyFreelancer {
        require(!locked, "no bueno");
        Request storage request = requests[_index];
        require(!request.locked, "Request is locked");
        require(!request.paid, "Already paid");
        locked = true;
        
        (bool success,) = freelancer.call{value:request.amount}("");
        require(success, "Transfer failed.");
        
        request.paid = true;
        locked = false;
        emit RequestPaid(msg.sender, request.amount);
    }
}