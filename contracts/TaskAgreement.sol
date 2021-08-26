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


    uint constant public commission = 4;
    uint numTasks;
    uint[] disputedTasks;
    // not sure if this mapping is necessary
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

    function getDisputedTasks() external view returns(uint[] memory) {
        return disputedTasks;
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
        } else if(msg.sender == task.thirdParty.to) {
            task.thirdParty.evidence.push(evidence);
        }
    }

    function approveTask(
        uint taskId
    ) external 
    validTaskId(taskId) notCompleted(taskId) 
    isValidUser(taskId) requireThirdParty(taskId) {
        Task storage task = tasks[taskId];
        if(msg.sender == task.consumer.to) {
            require(task.provider.approved,
                "Provider must approve task before you can approve eth transfer");
            /* This check seems like a bit of a waste since this
            function won't execute unless the task hasn't been completed */ 
            /* ^ if(task.consumer.approved), then that automatically means task.completed.
            therefore this function wouldn't even be running */
            require(!task.consumer.approved,
                "You can not approve a task twice");
            task.provider.to.transfer(task.price);
            task.consumer.approved = true;
            task.completed = true;
        } else if(msg.sender == task.provider.to) {
            require(!task.provider.approved,
                "You can not approve a task twice");
            task.provider.approved = true;
        }
        if(task.dispute == DisputeStage.ThirdParty){
            uint thirdPartyCommission = task.price * commission / 100;
            uint newTxPrice = task.price - thirdPartyCommission;

            task.provider.to.transfer(newTxPrice);
            task.thirdParty.to.transfer(thirdPartyCommission);

            task.thirdParty.approved = true;
            task.completed = true;
            removeFromDisapproved(taskId);
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
        /* would like to place if(msg.sender == task.provider) out here
        but would want to end function execution inside of it. not sure 
        how to handle */
        // Is there a better way to structure all this without the nested ifs?
        if(task.dispute == DisputeStage.None) {
            if(msg.sender == task.consumer.to) {
                task.consumer.approved = false;
                task.provider.approved = false;
                task.dispute = DisputeStage.Internal;
            } else if(msg.sender == task.provider.to) {
                task.consumer.to.transfer(task.price);
                task.completed = true;
            }
        } else if(task.dispute == DisputeStage.Internal) {
            if(msg.sender == task.consumer.to) {
                task.consumer.approved = false;
                task.provider.approved = false;
                task.dispute = DisputeStage.ThirdParty;
                disputedTasks.push(task.id);
            } else if(msg.sender == task.provider.to) {
                /* If provider disapproves task, then 
                ether should be sent back to consumer. */
                task.consumer.to.transfer(task.price);
                task.completed = true;
            }
        } else if(task.dispute == DisputeStage.ThirdParty) {
            task.consumer.to.transfer(task.price);
            task.completed = true;
            removeFromDisapproved(taskId);
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

    function removeFromDisapproved(uint taskId) internal {
        uint taskIndex;
        for(uint i = 0; i < disputedTasks.length; i++){
            if(disputedTasks[i] == taskId){
                taskIndex = i;
                break;
            }
        }
        for(uint i = taskIndex; i < disputedTasks.length; i++){
            if(i == disputedTasks.length - 1){
                disputedTasks.pop();
                break;
            }
            disputedTasks[i] = disputedTasks[i+1];
        }
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