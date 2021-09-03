//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

// ensure that vendor != client
// ensure that NOR vendor NOR client NOR third party can be address.this
// ensure that msg.value is returned if user addFunds() but task expires 
// test both above
// test for getUserTasks();
// add tests for addFunds + addTime notCompleted modifier 
// // side noat, i don't even think testing for the 
// // modifier is necesary. already tested with all the other
// // functions, so why these as well?
// need to work on the business specifics on whether expire() works when task.thirdParty
// i think ^ should be yes

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
        User vendor;
        User client;
        User thirdParty;
        DisputeStage dispute;
        bool completed;
        uint expiration;
    }

    struct TaskRef {
        uint id;
        string description;
    }

    enum DisputeStage {
        None,
        Internal,
        ThirdParty
    }

    uint public commission = 4;
    uint numTasks;
    TaskRef[] disputedTasks;
    mapping(address => TaskRef[]) userTasks;
    mapping(uint => Task) tasks;

    modifier validTaskId(uint taskId) {
        require(taskId < numTasks, "Must pass a valid task ID");
        _;
    }

    modifier validStrLength(string memory str) {
        require(bytes(str).length > 0, 
            "String argument must be of valid length");
        _;
    }

    /* I actually combined this modifier with validExpirationTime() but 
    decided against that in order to have more consice error messages */
    modifier validEthQuantity() {
        require(msg.value > 0,
            "Must send ether to execute function");
        _;
    }    

    modifier validExpirationTime(uint time) {
        require(time > 0,
            "Must pass a valid expiration date");
        _;
    }

    // I wish there was a way to pass the result of a modifier into the function/next modifier
    modifier isValidUser(uint taskId) {
        Task memory task = tasks[taskId];
        require(
            msg.sender == task.client.to 
            || msg.sender == task.vendor.to
            || msg.sender == task.thirdParty.to, 
            "Can not interact with a task you're not a part of");
        _;
    }

    modifier notCompleted(uint taskId) {
        require(!tasks[taskId].completed, "This task has already been completed");
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
    
    function getTask(uint taskId) external view returns(Task memory) {
        Task memory requestedTask = tasks[taskId];
        return requestedTask;
    }

    function getUserTasks() external view returns(TaskRef[] memory) {
        TaskRef[] memory usersTasks = userTasks[msg.sender];
        return usersTasks;
    }

    function getDisputedTasks() external view returns(TaskRef[] memory) {
        return disputedTasks;
    }

    function removeFromDisputedTasks(
        uint taskId
    ) internal {
        uint taskIndex;
        for(uint i = 0; i < disputedTasks.length; i++){
            if(disputedTasks[i].id == taskId){
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

    function completeTask(
        Task storage task, 
        address payable to
    ) internal {
        if(task.thirdParty.to == address(0)) {
            to.transfer(task.price);
        } else {
            uint thirdPartyCommission = task.price * commission / 100;
            uint newTxPrice = task.price - thirdPartyCommission;

            to.transfer(newTxPrice);
            task.thirdParty.to.transfer(thirdPartyCommission);
        }
        task.completed = true;
    }

    function expireTask(uint taskId) public returns(bool){
        Task storage task = tasks[taskId];
        bool isExpired = false;
        if(!task.vendor.approved && task.dispute != DisputeStage.ThirdParty) {
            if(task.expiration <= block.timestamp) {
                completeTask(task, task.client.to);
                isExpired = true;
            }
        }
        return isExpired;
    }

    function createTask(
        address payable vendorAddress, 
        string memory description,
        uint expiresIn
    ) external payable
    validEthQuantity() validStrLength(description)
    validExpirationTime(expiresIn) {
        // should i modify the modifiers above to return msg.value if sent?
        /* actually, i don't think that would be necessary. if one of the
        modifiers is triggered, the function call reverts and contract resets state
        or some shit. so i'm pretty sure either a) msg.value isn't sent once call reverts,
        b) msg.value is sent back to sender once call reverts */
        require(vendorAddress != payable(msg.sender),
            "Vendor & Client addresses should be distinct");
        require(vendorAddress != payable(address(this)),
            "This smart contract can not be a task vendor");
        Task memory task;
        User memory vendor;
        User memory client;
        vendor.to = vendorAddress;
        client.to = payable(msg.sender);

        task.id = numTasks;
        task.vendor = vendor;
        task.client = client;
        task.price = msg.value;
        task.description = description;
        task.dispute = DisputeStage.None;
        task.expiration = block.timestamp + expiresIn;

        TaskRef memory taskRef;
        taskRef.id = task.id;
        taskRef.description = task.description;

        tasks[numTasks] = task;
        userTasks[vendorAddress].push(taskRef);
        userTasks[msg.sender].push(taskRef);

        emit TaskCreated(task.id, task, tasks[numTasks].id == numTasks);
        numTasks++; 
    }

    function addFunds(uint taskId) external payable 
    validTaskId(taskId) validEthQuantity() 
    notCompleted(taskId)
    returns(bool) {
        bool isExpired = expireTask(taskId);
        if(isExpired) {
            // sends back payment in case task already expired
            payable(msg.sender).transfer(msg.value);
            return false;
        }
        Task storage task = tasks[taskId];
        require(msg.sender == task.client.to,
            "Only the client of this task may add funds");
        task.price = task.price + msg.value;
        return true;
    }

    function addTime(uint taskId, uint time) external 
    validTaskId(taskId) validExpirationTime(time)
    notCompleted(taskId)
    returns(bool) {
        bool isExpired = expireTask(taskId);
        if(isExpired) return false;
        Task storage task = tasks[taskId];
        require(msg.sender == task.client.to,
            "Only the client of this task may add expiration time");
        task.expiration = task.expiration + time;
        return true;
    }

    // Should i add a limit to how much evidence one party can provide?
    function addEvidence(
        uint taskId,
        string calldata evidence
    ) external 
    validTaskId(taskId) notCompleted(taskId) 
    isValidUser(taskId) validStrLength(evidence)
    returns(bool) {
        bool isExpired = expireTask(taskId);
        if(isExpired) return false;
        Task storage task = tasks[taskId];
        if(msg.sender == task.client.to) {
            task.client.evidence.push(evidence);
        } else if(msg.sender == task.vendor.to) {
            task.vendor.evidence.push(evidence);
        } else if(msg.sender == task.thirdParty.to) {
            task.thirdParty.evidence.push(evidence);
        }
        return true;
    }

    function approveTask(
        uint taskId
    ) external 
    validTaskId(taskId) notCompleted(taskId) 
    isValidUser(taskId) requireThirdParty(taskId) 
    returns(bool) {
        bool isExpired = expireTask(taskId);
        if(isExpired) return false;
        Task storage task = tasks[taskId];
        if(msg.sender == task.client.to) {
            require(task.vendor.approved,
                "Vendor must approve task before you can approve eth transfer");
            /* This check seems like a bit of a waste since this
            function won't execute unless the task hasn't been completed */ 
            /* ^ if(task.client.approved), that automatically means task.completed.
            therefore this function wouldn't even be running */
            require(!task.client.approved,
                "You can not approve a task twice");
            task.client.approved = true;
            completeTask(task, task.vendor.to);
        } else if(msg.sender == task.vendor.to) {
            require(!task.vendor.approved,
                "You can not approve a task twice");
            task.vendor.approved = true;
        }
        if(task.dispute == DisputeStage.ThirdParty){
            task.thirdParty.approved = true;
            completeTask(task, task.vendor.to);
        }
        return true;
    }

    function disapproveTask(
        uint taskId
    ) external 
    validTaskId(taskId) notCompleted(taskId) 
    isValidUser(taskId) requireThirdParty(taskId)
    returns(bool) {
        bool isExpired = expireTask(taskId);
        if(isExpired) return false;
        Task storage task = tasks[taskId];
        if(msg.sender == task.client.to) {
            require(task.vendor.approved,
                "Vendor must approve task on their end before you can open a dispute");
        }
        /* would like to place if(msg.sender == task.vendor) out here
        but would want to end function execution inside of it. not sure 
        how to handle */
        // Is there a better way to structure all this without the nested ifs?
        if(task.dispute == DisputeStage.None) {
            if(msg.sender == task.client.to) {
                task.client.approved = false;
                task.vendor.approved = false;
                task.dispute = DisputeStage.Internal;
            } else if(msg.sender == task.vendor.to) {
                /* If vendor disapproves task, then 
                ether should be sent back to client. */
                completeTask(task, task.client.to);
            }
        } else if(task.dispute == DisputeStage.Internal) {
            if(msg.sender == task.client.to) {
                task.client.approved = false;
                task.vendor.approved = false;
                task.dispute = DisputeStage.ThirdParty;

                TaskRef memory taskRef;
                taskRef.id = task.id;
                taskRef.description = task.description;

                disputedTasks.push(taskRef);
            } else if(msg.sender == task.vendor.to) {
                completeTask(task, task.client.to);
            }
        } else if(task.dispute == DisputeStage.ThirdParty) {
            completeTask(task, task.client.to);
        }
        return true;
    }

    function assignThirdParty(
        uint taskId
    ) external 
    validTaskId(taskId) notCompleted(taskId)
    returns(bool) {
        bool isExpired = expireTask(taskId);
        if(isExpired) return false;
        Task storage task = tasks[taskId];
        require(task.thirdParty.to == address(0), 
            "A third party has already been assigned to this task");
        require(msg.sender != task.client.to && msg.sender != task.vendor.to,
            "Third party can not already be connected to this task");
        require(task.dispute == DisputeStage.ThirdParty,
            "Cannot assign a third party to this task until internally decided");
        /* Not even sure that this is necessary? How would this 
        smart contract call an external function? for this reason i won't
        be conducting the test below for client in createTask() */
        require(msg.sender != address(this),
            "This smart contract can not be the third party of a task");
        User memory thirdParty;
        TaskRef memory taskRef;
        thirdParty.to = payable(msg.sender);
        task.thirdParty = thirdParty;
        taskRef.id = task.id;
        taskRef.description = task.description;

        userTasks[msg.sender].push(taskRef);        
        removeFromDisputedTasks(task.id);
        /* do return statements use more Gas? if so, i'd 
        try and find a different solution */
        return true;
    }
}