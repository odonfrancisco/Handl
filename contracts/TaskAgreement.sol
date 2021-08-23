//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract TaskAgreement {
    event TaskCreated (
        uint id,
        Task task,
        bool success
    );
    
    struct Task {
        uint id;
        address provider;
        address consumer;
        bool completed;
        uint price;
        string description;
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
        address provider, 
        address consumer, 
        string memory description, 
        uint price
    ) external {
        Task memory task;
        task.id = numTasks;
        task.provider = provider;
        task.consumer = consumer;
        task.price = price;
        task.description = description;

        tasks[numTasks] = task;
        userTasks[provider].push(task.id);
        userTasks[consumer].push(task.id);

        emit TaskCreated(numTasks, task, tasks[numTasks].id == numTasks);
        numTasks++; 
    }
}