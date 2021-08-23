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
        DisputeStage dispute;
        address payable thirdParty;
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
    ) external payable {
        require(bytes(description).length > 0, 
            "Task description must be of valid length");
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

    function addEvidence(
        uint taskId,
        string calldata evidence
    ) external validTaskId(taskId) {
        Task storage task = tasks[taskId];
        require(task.consumer.to == msg.sender || task.provider.to == msg.sender, 
            "Can not add evidence to a task you're not a part of");
        if(task.consumer.to == msg.sender) {
            task.consumer.evidence.push(evidence);
        } else if(task.provider.to == msg.sender) {
            task.provider.evidence.push(evidence);
        }
    }

    function approveTask(
        uint taskId
    ) external validTaskId(taskId) {
        Task storage task = tasks[taskId];
        // if msg.sender is consumer, require that provider has approved task first
        // I think i'm also supposed to handle different dispute settings? not sure
        if(task.consumer.to == msg.sender) {
            require(task.provider.approved,
                "Provider must approve task before you can approve eth transfer");
            require(!task.consumer.approved,
                "You can not approve a task twice");
            task.consumer.approved = true;
            // call function to transfer funds to provider;
        } else if(task.provider.to == msg.sender) {
            require(!task.provider.approved,
                "You can not approve a task twice");
            task.provider.approved = true;
        }
        // Need to handle IF thirdParty;
        /* IF thirdParty == msg.sender && task.dispute == DisputeStage.ThirdParty,
        send funds to provider */
    }

    function disapproveTask(
        uint taskId
    ) external validTaskId(taskId) {
        Task storage task = tasks[taskId];
        // Is there a better way to structure all this without the nested ifs?
        if(task.dispute == DisputeStage.None) {
            if(task.consumer.to == msg.sender) {
                require(task.provider.approved,
                    "Provider must approve task on their end before you can open a dispute");
                task.consumer.approved = false;
                task.dispute = DisputeStage.Internal;
            } else if(task.provider.to == msg.sender) {
                /* WTF would i do here? if provider immediately wants to open
                a dispute, therefore not get paid??? not sure lol */
            }
        } else if(task.dispute == DisputeStage.Internal) {
            if(task.consumer.to == msg.sender) {
                require(task.provider.approved,
                    "Provider must approve task on their end before you can open a dispute");
                task.consumer.approved = false;
                task.dispute = DisputeStage.ThirdParty;
            } else if(task.provider.to == msg.sender) {
                /* If provider disapproves task while dispute is internal, then 
                ether should be sent back to consumer. */
                // call function to send funds to consumer
            }
        } else if(task.dispute == DisputeStage.ThirdParty) {
            require(msg.sender == task.thirdParty, 
                "Only the third party may make a decision at this stage of dispute");
            // Call function to send funds back to consumer
        }

    }

    function assignThirdParty(uint taskId) external validTaskId(taskId) {
        Task storage task = tasks[taskId];
        require(task.thirdParty == address(0), 
            "A third party has already been assigned to this task");
        require(task.dispute == DisputeStage.ThirdParty,
            "Cannot assign a third party to this task until internally decided");
        task.thirdParty = payable(msg.sender);
    } 

    modifier validTaskId(uint taskId) {
        require(taskId < numTasks, "Must pass a valid task ID");
        _;
    }
}