const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { parseEther, formatEther } = ethers.utils;

// Dispute Enum
const dispute = {
    None: 0,
    Internal: 1,
    ThirdParty: 2
}

let taskDescriptions = ["Test Task", "Test 2", "Test 3"];
let providerEvidence = [
    "https://www.acutaboveexteriors.com/wp-content/uploads/2020/05/file-3.jpg",
    "https://www.sempersolaris.com/wp-content/uploads/2018/08/roof-1-760x340.jpg"
];
let consumerEvidence = [
    "http://www.homebyhomeexteriors.com/wp-content/uploads/2014/04/photo-5.jpg",
    "http://gjkeller.com/wp-content/uploads/2017/05/when-roofing-goes-wrong-1.jpg"
];
let prices = [35, 49, 43];
const reducer = (accumulator, currentValue) => accumulator + currentValue;


describe("TaskAgreement", () => {
    let consumer, provider, thirdParty;
    let taskAgreement;
    let taskIds = [];

    before(async () => {
        const TaskAgreementContract = await ethers.getContractFactory("TaskAgreement");
        taskAgreement = await TaskAgreementContract.deploy();
        await taskAgreement.deployed();
        [consumer, provider, thirdParty] = await ethers.getSigners();
    })
    
    it("Should create task successfully", async () => {
        const emittedTasks = [];

        for(let i = 0; i < 3; i++){
            const createTaskTx = await 
                (await taskAgreement
                .connect(consumer)
                .createTask(provider.address, taskDescriptions[i], {value: parseEther(prices[i].toString())})
                ).wait();
            const emittedEvent = createTaskTx.events[0].args;
            const emittedTask = emittedEvent.task;
            taskIds.push(emittedEvent.id);
            emittedTasks.push(emittedTask);
        }

        expect(emittedTasks.length).to.equal(3);

        for(let i = 0; i < 3; i++){                
            const newTask = await taskAgreement.getTask(i);
            const currentTask = emittedTasks[i];
            const currentTaskPrice = formatEther(currentTask.price);
            const priceListBN = formatEther(parseEther(prices[i].toString()));
            expect(currentTaskPrice).to.equal(priceListBN);
            expect(currentTask.description).to.equal(taskDescriptions[i]);
            expect(currentTask.provider.to).to.equal(provider.address);
            expect(currentTask.consumer.to).to.equal(consumer.address);
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
        pricesSumBN = parseEther(prices.reduce(reducer).toString())
        expect(balance).to.equal(pricesSumBN);
    })

    it("Should NOT create task if description not valid length", async () => {
        await expect(
            taskAgreement.createTask(provider.address, "", {value: 34})
        ).to.be.revertedWith("String argument must be of valid length")
    })

    it("Should NOT create task if no value is sent", async () => {
        await expect(
            taskAgreement.createTask(provider.address, taskDescriptions[0])
        ).to.be.revertedWith("Must send ether to execute function")
    })

    it("Should add evidence to task correctly", async () => {
        const [evidence, evidence2] = providerEvidence;
        await taskAgreement
            .connect(provider)
            .addEvidence(taskIds[0], evidence);
        let task = await taskAgreement.getTask(taskIds[0]);
        expect(task.provider.evidence.length).to.equal(1); 
        expect(task.provider.evidence[0]).to.equal(evidence);

        await taskAgreement.connect(provider)
            .addEvidence(taskIds[0], evidence2);
        task = await taskAgreement.getTask(taskIds[0]);
        expect(task.provider.evidence.length).to.equal(2); 
        expect(task.provider.evidence[1]).to.equal(evidence2);
    })

    it("Should NOT add evidence if string parameter empty", async () => {
        await expect(
            taskAgreement.connect(consumer)
                .addEvidence(taskIds[0], "")
        ).to.be.revertedWith("String argument must be of valid length")
    })

    it("Should NOT add evidence to task if not consumer or provider of task", async () => {
        await expect(
            taskAgreement.connect(thirdParty)
                .addEvidence(taskIds[0], "Chruast")
        ).to.be.revertedWith("Can not interact with a task you're not a part of")
    })

    it("Should NOT approve task by consumer initially", async () => {
        await expect(
            taskAgreement.connect(consumer)
                .approveTask(taskIds[0])
        ).to.be.revertedWith("Provider must approve task before you can approve eth transfer")
    })

    it("Should approve task by provider initially", async () => {
        await (await taskAgreement.connect(provider)
            .approveTask(taskIds[0])).wait();
        const task = await taskAgreement.getTask(taskIds[0]);
        expect(task.provider.approved).to.be.true;
    })

    it("Should NOT approve task by provider twice", async () => {
        // task was already approved by provider in previous test funct
        await expect(
            taskAgreement.connect(provider)
                .approveTask(taskIds[0])
        ).to.be.revertedWith("You can not approve a task twice");
    })

    // need to also check for sending ether to provider + task.finished == true
    it("Should approve task by consumer on no dispute", async () => {
        await (await taskAgreement.connect(consumer)
            .approveTask(taskIds[0])).wait();
        const task = await taskAgreement.getTask(taskIds[0]);
        expect(task.consumer.approved).to.be.true;
    })

    it("Should NOT approve task by consumer twice", async () => {
        await expect(
            taskAgreement.connect(consumer)
                .approveTask(taskIds[0])
        ).to.be.revertedWith("You can not approve a task twice");        
    })

    it("Should NOT disapprove task-DISPUTE.NONE by consumer before provider has chance to approve", async () => {
        await expect(
            taskAgreement.connect(consumer)
                .disapproveTask(taskIds[1])
        ).to.be.revertedWith("Provider must approve task on their end before you can open a dispute")
    })

    it("Should disapprove task-DISPUTE.NONE by consumer after provider has approved task", async () => {
        const taskId = taskIds[1];
        await (await taskAgreement.connect(provider)
            .approveTask(taskId)).wait();
        await (await taskAgreement.connect(consumer)
            .disapproveTask(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        expect(task.dispute).to.equal(dispute.Internal);
        expect(task.consumer.approved).to.false;
        expect(task.provider.approved).to.false;
    })

    it("Should NOT disapprove task-DISPUTE.INTERNAL by consumer before provider approves", async () => {
        const taskId = taskIds[1];
        await expect(
            taskAgreement.connect(consumer)
                .disapproveTask(taskId)
        ).to.be.revertedWith("Provider must approve task on their end before you can open a dispute")
    })

    it("Should disapprove task-DISPUTE.INTERNAL by provider and send eth back to consumer", async () => {
        const taskId = taskIds[1];
        const consumerBalanceBefore = await consumer.getBalance();
        await (await taskAgreement.connect(provider)
            .disapproveTask(taskId)).wait();

        const task = await taskAgreement.getTask(taskId);
        const taskPrice = formatEther(task.price);
        const consumerBalanceAfter = await consumer.getBalance();

        expect(task.completed).to.be.true;
        expect(consumerBalanceAfter.sub(consumerBalanceBefore))
            .to.equal(parseEther(taskPrice))
    })

    // it("Should ")
    
})