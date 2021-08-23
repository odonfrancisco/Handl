const { expect } = require("chai");
const { ethers } = require("hardhat");

// Dispute Enum
const dispute = {
    None: 0,
    Internal: 1,
    ThirdParty: 2
}

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
                .createTask(provider, taskDescriptions[i], {value: prices[i]})).wait();
            const emittedEvent = createTaskTx.events[0].args;
            const emittedTask = emittedEvent.task;
            emittedTasks.push(emittedTask);
        }

        expect(emittedTasks.length).to.equal(2);

        for(let i = 0; i < 2; i++){                
            const newTask = await taskAgreement.getTask(i);
            const currentTask = emittedTasks[i];
            expect(currentTask.price).to.equal(prices[i]);
            expect(currentTask.description).to.equal(taskDescriptions[i]);
            expect(currentTask.provider.to).to.equal(provider);
            expect(currentTask.consumer.to).to.equal(consumer);
            expect(currentTask.id).to.equal(i);
            expect(currentTask.dispute).to.equal(dispute.None);
            expect(newTask.price).to.equal(currentTask.price);
            expect(newTask.description).to.equal(currentTask.description);
            expect(newTask.provider.to).to.equal(currentTask.provider.to);
            expect(newTask.consumer.to).to.equal(currentTask.consumer.to);
            expect(newTask.id).to.equal(currentTask.id);
            expect(newTask.dispute).to.equal(currentTask.dispute);
        }

        const balance = await ethers.provider.getBalance(taskAgreement.address);
        const reducer = (accumulator, currentValue) => accumulator + currentValue;
        const pricesSumBN = await ethers.BigNumber.from(prices.reduce(reducer));
        expect(balance).to.equal(pricesSumBN);
    })
})