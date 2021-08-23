const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskAgreement", () => {
    it("Should create task successfully", async () => {
        const [addr1, addr2] = await ethers.getSigners();
        const consumer = addr1.address;
        const provider = addr2.address;
        const taskDescriptions = ["Test Task", "Test 2"];
        const prices = [35, 49];
        
        const TaskAgreement = await ethers.getContractFactory("TaskAgreement");
        const taskAgreement = await TaskAgreement.deploy();
        await taskAgreement.deployed();

        const emittedTasks = [];

        for(let i = 0; i < 2; i++){
            const createTaskTx = await (await taskAgreement
                .createTask(provider, consumer, taskDescriptions[i], prices[i])).wait();
            const emittedEvent = createTaskTx.events[0].args;
            const emittedTask = emittedEvent.task;
            emittedTasks.push(emittedTask);
        }

        expect(emittedTasks.length).to.equal(2);

        for(let i = 0; i < 2; i++){                
            const newTask = await taskAgreement.getTask(i);
            expect(emittedTasks[i].price).to.equal(prices[i]);
            expect(emittedTasks[i].description).to.equal(taskDescriptions[i]);
            expect(emittedTasks[i].provider).to.equal(provider);
            expect(emittedTasks[i].consumer).to.equal(consumer);
            expect(emittedTasks[i].id).to.equal(i);
            expect(newTask.price).to.equal(emittedTasks[i].price);
            expect(newTask.description).to.equal(emittedTasks[i].description);
            expect(newTask.provider).to.equal(emittedTasks[i].provider);
            expect(newTask.consumer).to.equal(emittedTasks[i].consumer);
            expect(newTask.id).to.equal(emittedTasks[i].id);
        }
    })
})