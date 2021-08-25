//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract TaskAgreement {
    event TaskCreated (
        uint id,
        Task task,
        bool success
    );

    struct User {
        address payable to;
        string[] evidence;
        bool approved;
    }
    
    struct Task {
        uint id;
        uint price;
        string description;
        User provider;
        User consumer;
        User thirdParty;
        DisputeStage dispute;
        bool completed;
    }

    enum DisputeStage {
        None,
        Internal,
        ThirdParty
    }


    uint numTasks;
    mapping(address => uint[]) userTasks;
    mapping(uint => Task) tasks;
    Task[] disputedTasks;
    
    constructor() {}

    function getTask(uint taskId) external view returns(Task memory) {
        Task memory requestedTask = tasks[taskId];
        return requestedTask;
    }

    function getUserTasks(address userAddress) external view returns(uint[] memory) {
        uint[] memory usersTasks = userTasks[userAddress];
        return usersTasks;
    }

    function createTask(
        address payable providerAddress, 
        string memory description
    ) external payable
    validEthQuantity() validStrLength(description) {
        Task memory task;
        User memory provider;
        User memory consumer;
        provider.to = providerAddress;
        consumer.to = payable(msg.sender);

        task.id = numTasks;
        task.provider = provider;
        task.consumer = consumer;
        task.price = msg.value;
        task.description = description;
        task.dispute = DisputeStage.None;

        tasks[numTasks] = task;
        userTasks[providerAddress].push(task.id);
        userTasks[msg.sender].push(task.id);

        emit TaskCreated(numTasks, task, tasks[numTasks].id == numTasks);
        numTasks++; 
    }

    // Add function where consumer can increase the price(and send more ether);

    // Should i add a limit to how much evidence one party can provide?
    function addEvidence(
        uint taskId,
        string calldata evidence
    ) external 
    validTaskId(taskId) notCompleted(taskId) 
    isValidUser(taskId) validStrLength(evidence) {
        Task storage task = tasks[taskId];
        if(msg.sender == task.consumer.to) {
            task.consumer.evidence.push(evidence);
        } else if(msg.sender == task.provider.to) {
            task.provider.evidence.push(evidence);
        }
    }

    function approveTask(
        uint taskId
    ) external 
    validTaskId(taskId) notCompleted(taskId) 
    isValidUser(taskId) requireThirdParty(taskId) {
        Task storage task = tasks[taskId];
        // I think i'm also supposed to handle different dispute settings? not sure
        if(msg.sender == task.consumer.to) {
            require(task.provider.approved,
                "Provider must approve task before you can approve eth transfer");
            require(!task.consumer.approved,
                "You can not approve a task twice");
            task.consumer.approved = true;
            // call function to transfer funds to provider;
        } else if(msg.sender == task.provider.to) {
            require(!task.provider.approved,
                "You can not approve a task twice");
            task.provider.approved = true;
        }
        if(task.dispute == DisputeStage.ThirdParty){
            task.provider.to.transfer(task.price);
        }
    }

    function disapproveTask(
        uint taskId
    ) external 
    validTaskId(taskId) notCompleted(taskId) 
    isValidUser(taskId) requireThirdParty(taskId) {
        Task storage task = tasks[taskId];
        if(msg.sender == task.consumer.to) {
            require(task.provider.approved,
                "Provider must approve task on their end before you can open a dispute");
        }
        // Is there a better way to structure all this without the nested ifs?
        if(task.dispute == DisputeStage.None) {
            if(msg.sender == task.consumer.to) {
                task.consumer.approved = false;
                task.provider.approved = false;
                task.dispute = DisputeStage.Internal;
            } else if(msg.sender == task.provider.to) {
                /* WTF would i do here? if provider immediately wants to open
                a dispute, therefore not get paid??? not sure lol */
            }
        } else if(task.dispute == DisputeStage.Internal) {
            if(msg.sender == task.consumer.to) {
                task.consumer.approved = false;
                task.provider.approved = false;
                task.dispute = DisputeStage.ThirdParty;
                // add task to disputedTasks array.
            } else if(msg.sender == task.provider.to) {
                /* If provider disapproves task while dispute is internal, then 
                ether should be sent back to consumer. */
                task.consumer.to.transfer(task.price);
                task.completed = true;
            }
        } else if(task.dispute == DisputeStage.ThirdParty) {
            task.consumer.to.transfer(task.price);
        }

    }

    function assignThirdParty(
        uint taskId
    ) external 
    validTaskId(taskId) notCompleted(taskId) {
        Task storage task = tasks[taskId];
        require(task.thirdParty.to == address(0), 
            "A third party has already been assigned to this task");
        require(task.dispute == DisputeStage.ThirdParty,
            "Cannot assign a third party to this task until internally decided");
        User memory thirdParty;
        thirdParty.to = payable(msg.sender);
        task.thirdParty = thirdParty;
    } 
    

    modifier validTaskId(uint taskId) {
        require(taskId < numTasks, "Must pass a valid task ID");
        _;
    }

    modifier notCompleted(uint taskId) {
        require(!tasks[taskId].completed, "This task has already been completed");
        _;
    }
    // I wish there was a way to pass the result of a modifier into the function/next modifier
    modifier isValidUser(uint taskId) {
        Task memory task = tasks[taskId];
        require(
            msg.sender == task.consumer.to 
            || msg.sender == task.provider.to
            || msg.sender == task.thirdParty.to, 
            "Can not interact with a task you're not a part of");
        _;
    }

    modifier requireThirdParty(uint taskId) {
        Task memory task = tasks[taskId];
        if(task.dispute == DisputeStage.ThirdParty) {
            require(msg.sender == task.thirdParty.to,
                "Only the third party may make a decision at this stage of dispute");
        }
        _;
    }

    modifier validStrLength(string memory str) {
        require(bytes(str).length > 0, 
            "String argument must be of valid length");
        _;
    }

    modifier validEthQuantity() {
        require(msg.value > 0,
            "Must send ether to execute function");
        _;
    }
}