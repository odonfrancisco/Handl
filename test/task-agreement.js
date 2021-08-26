const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { parseEther, formatEther } = ethers.utils;

// Dispute Enum
const dispute = {
    None: 0,
    Internal: 1,
    ThirdParty: 2
}

let taskDescriptions = ["Test Task", "Test 2", "Test 3", "Test 4", "Test 5", "Test 6"];
let providerEvidence = [
    "https://www.acutaboveexteriors.com/wp-content/uploads/2020/05/file-3.jpg",
    "https://www.sempersolaris.com/wp-content/uploads/2018/08/roof-1-760x340.jpg"
];
let consumerEvidence = [
    "http://www.homebyhomeexteriors.com/wp-content/uploads/2014/04/photo-5.jpg",
    "http://gjkeller.com/wp-content/uploads/2017/05/when-roofing-goes-wrong-1.jpg"
];
let prices = [35, 49, 43, 26, 13, 7];
const reducer = (accumulator, currentValue) => accumulator + currentValue;

/* I'm testing a singular task throughout separate test
instead of testing an independent task per test. 
don't know if this is ok or if i should be testing an independent task per test.*/

describe("TaskAgreement", () => {
    let consumer, provider, thirdParty;
    let taskAgreement;
    let taskIds = [];

    before(async () => {
        const taskAgreementContract = await ethers.getContractFactory("TaskAgreement");
        taskAgreement = await taskAgreementContract.deploy();
        await taskAgreement.deployed();
        [consumer, provider, thirdParty] = await ethers.getSigners();
    })
    
    it("Should create tasks successfully", async () => {
        const emittedTasks = [];

        for(let i = 0; i < prices.length; i++){
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

        expect(emittedTasks.length).to.equal(prices.length);

        for(let i = 0; i < 2; i++){                
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

    it("Should bring tasks 3 & 4 up to speed", async () => {
        let taskId = taskIds[2];
        // have to bring 3rd task all the way up to dispute.internal
        await (await taskAgreement.connect(provider)
            .approveTask(taskId)).wait()
        await (await taskAgreement.connect(consumer)
            .disapproveTask(taskId)).wait()
        await (await taskAgreement.connect(provider)
            .approveTask(taskId)).wait()
        // have to bring 4rd task all the way up to dispute.internal
        taskId = taskIds[3];
        await (await taskAgreement.connect(provider)
            .approveTask(taskId)).wait()
        await (await taskAgreement.connect(consumer)
            .disapproveTask(taskId)).wait()
        await (await taskAgreement.connect(provider)
            .approveTask(taskId)).wait()
        // have to bring 5th task all the way up to dispute.thirdParty
        taskId = taskIds[4];
        await (await taskAgreement.connect(provider)
            .approveTask(taskId)).wait()
        await (await taskAgreement.connect(consumer)
            .disapproveTask(taskId)).wait()
        await (await taskAgreement.connect(provider)
            .approveTask(taskId)).wait()
        await (await taskAgreement.connect(consumer)
            .disapproveTask(taskId)).wait()
        await (await taskAgreement.connect(thirdParty)
            .assignThirdParty(taskId)).wait()
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

        await taskAgreement.connect(consumer)
            .addEvidence(taskIds[0], evidence2);
        task = await taskAgreement.getTask(taskIds[0]);
        expect(task.consumer.evidence.length).to.equal(1); 
        expect(task.consumer.evidence[0]).to.equal(evidence2);
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

    it("Should NOT approve task.DISPUTE.NONE by consumer initially", async () => {
        await expect(
            taskAgreement.connect(consumer)
                .approveTask(taskIds[0])
        ).to.be.revertedWith("Provider must approve task before you can approve eth transfer")
    })

    it("Should approve task.DISPUTE.NONE by provider initially", async () => {
        await (await taskAgreement.connect(provider)
            .approveTask(taskIds[0])).wait();
        const task = await taskAgreement.getTask(taskIds[0]);
        expect(task.provider.approved).to.be.true;
    })

    it("Should NOT approve task.DISPUTE.NONE by provider twice", async () => {
        // task was already approved by provider in previous test
        await expect(
            taskAgreement.connect(provider)
                .approveTask(taskIds[0])
        ).to.be.revertedWith("You can not approve a task twice");
    })

    it("Should approve task.DISPUTE.NONE by consumer and send eth to provider", async () => {
        const providerBalanceBefore = await provider.getBalance();
        await (await taskAgreement.connect(consumer)
            .approveTask(taskIds[0])).wait();
        const task = await taskAgreement.getTask(taskIds[0]);
        const providerBalanceAfter = await provider.getBalance();
        const balanceDelta = providerBalanceAfter.sub(providerBalanceBefore);
        expect(task.consumer.approved).to.be.true;
        expect(balanceDelta).to.equal(task.price);
        expect(task.provider.approved).to.be.true;
        expect(task.completed).to.be.true;
    })

    it("Should NOT approve task.DISPUTE.NONE by consumer twice", async () => {
        await expect(
            taskAgreement.connect(consumer)
                .approveTask(taskIds[0])
        ).to.be.revertedWith("This task has already been completed");        
    })

    it("Should disapprove task.DISPUTE.NONE by provider and return eth to consumer", async () => {
        const consumerBalanceBefore = await consumer.getBalance();
        await (await taskAgreement.connect(provider)
            .disapproveTask(taskIds[5])).wait();
        const consumerBalanceAfter = await consumer.getBalance();
        const balanceDelta = consumerBalanceAfter.sub(consumerBalanceBefore);
        const task = await taskAgreement.getTask(taskIds[5]);
        expect(balanceDelta).to.be.equal(task.price);
        expect(task.completed).to.be.true;
        expect(task.provider.approved).to.be.false;
    })

    it("Should NOT disapprove task.DISPUTE.NONE by consumer before provider has chance to approve", async () => {
        await expect(
            taskAgreement.connect(consumer)
                .disapproveTask(taskIds[1])
        ).to.be.revertedWith("Provider must approve task on their end before you can open a dispute")
    })

    it("Should disapprove task.DISPUTE.NONE by consumer after provider has approved task", async () => {
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

    it("Should NOT disapprove task.DISPUTE.INTERNAL by consumer before provider approves", async () => {
        const taskId = taskIds[1];
        await expect(
            taskAgreement.connect(consumer)
                .disapproveTask(taskId)
        ).to.be.revertedWith("Provider must approve task on their end before you can open a dispute")
    })

    it("Should disapprove task.DISPUTE.INTERNAL by provider and send eth back to consumer", async () => {
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

    it("Should NOT assign third party at task.DISPUTE.INTERNAL", async () => {
        const taskId = taskIds[2];
        await expect(
            taskAgreement.connect(thirdParty)
                .assignThirdParty(taskId)
        ).to.revertedWith("Cannot assign a third party to this task until internally decided");
    })

    it("Should disapprove task.DISPUTE.INTERNAL by consumer", async () => {
        const taskId = taskIds[2];
        await (await taskAgreement.connect(consumer)
            .disapproveTask(taskId)).wait()
        const task = await taskAgreement.getTask(taskId);
        expect(task.dispute).to.equal(dispute.ThirdParty)
    })

    it("Should approve task.DISPUTE.INTERNAL by consumer & send eth to provider", async () => {
        const taskId = taskIds[3];
        const providerBalanceBefore = await provider.getBalance();
        await (await taskAgreement.connect(consumer)
            .approveTask(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        const providerBalanceAfter = await provider.getBalance();
        const balanceDelta = providerBalanceAfter.sub(providerBalanceBefore);
        expect(balanceDelta).to.equal(task.price);
        expect(task.consumer.approved).to.be.true;
        expect(task.provider.approved).to.be.true;
        expect(task.completed).to.be.true;
        expect(task.dispute).to.equal(dispute.Internal);
    })

    it("Should NOT dissaprove||approve task.DISPUTE.THIRDPARTY if not third party", async () => {
        const taskId = taskIds[2];
        await (expect(
            taskAgreement.connect(provider)
                .approveTask(taskId)
        ).to.revertedWith("Only the third party may make a decision at this stage of dispute"))
        await (expect(
            taskAgreement.connect(consumer)
                .disapproveTask(taskId)
        ).to.revertedWith("Only the third party may make a decision at this stage of dispute"))
    })

    it("Should NOT assign third party if not valid task ID", async () => {
        await expect(
            taskAgreement.connect(thirdParty)
                .assignThirdParty(9813)
        ).to.revertedWith("Must pass a valid task ID");
    })

    it("Should assign third party to task.DISPUTE.THIRDPARTY", async () => {
        const taskId = taskIds[2];
        await (await taskAgreement.connect(thirdParty)
            .assignThirdParty(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        expect(task.thirdParty.to).to.equal(thirdParty.address);
    })

    it("Should NOT assign third party twice to task.DISPUTE.THIRDPARTY", async () => {
        const taskId = taskIds[2];
        await expect(
            taskAgreement.connect(thirdParty)
                .assignThirdParty(taskId)
        ).to.revertedWith("A third party has already been assigned to this task")
    })

    it("Should add evidence to task.DISPUTE.THIRDPARTY as any party correctly", async () => {
        const taskId = taskIds[2];
        await taskAgreement.connect(thirdParty)
            .addEvidence(taskId, "yeeyee");
        task = await taskAgreement.getTask(taskId);
        expect(task.thirdParty.evidence.length).to.equal(1); 
        expect(task.thirdParty.evidence[0]).to.equal("yeeyee");

        await taskAgreement.connect(consumer)
            .addEvidence(taskId, "yeeyee");
        task = await taskAgreement.getTask(taskId);
        expect(task.consumer.evidence.length).to.equal(1); 
        expect(task.consumer.evidence[0]).to.equal("yeeyee");

        await taskAgreement.connect(provider)
            .addEvidence(taskId, "yeeyee");
        task = await taskAgreement.getTask(taskId);
        expect(task.provider.evidence.length).to.equal(1); 
        expect(task.provider.evidence[0]).to.equal("yeeyee");
    })

    /* if i were to include a voting feature instead of just one thirdParty, 
     would need another test to test that it's not assigning same third party twice */
    
    it("Should disapprove task.DISPUTE.THIRDPARTY as thirdParty", async () => {
        const taskId = taskIds[2];
        const task = await taskAgreement.getTask(taskId);
        const consumerBalanceBefore = await consumer.getBalance();
        const thirdPartyBalanceBefore = await thirdParty.getBalance();
        let disputedTasks = await taskAgreement.getDisputedTasks();
        let disputedTaskId = disputedTasks.filter(id => id.eq(taskId));
        expect(disputedTaskId.length).to.equal(1);
        expect(disputedTaskId[0]).to.equal(taskId);
        await (await taskAgreement
            .connect(thirdParty)
            .disapproveTask(taskId)).wait();
        const consumerBalanceAfter = await consumer.getBalance();
        const consumerBalanceDelta = consumerBalanceAfter.sub(consumerBalanceBefore);
        const thirdPartyBalanceAfter = await thirdParty.getBalance();
        const thirdPartyBalanceDelta = thirdPartyBalanceAfter.sub(thirdPartyBalanceBefore);
        
        expect(consumerBalanceDelta).to.equal(task.price);
        // expect thirdPartyDelta to equal task.price * percentage
        disputedTasks = await taskAgreement.getDisputedTasks();
        disputedTaskId = disputedTasks.filter(id => id.eq(taskId));
        expect(disputedTaskId.length).to.equal(0);
    })

    it("Should approve task.DISPUTE.THIRDPARTY as thirdParty", async () => {
        const taskId = taskIds[4];
        const providerBalanceBefore = await provider.getBalance();
        const thirdPartyBalanceBefore = await thirdParty.getBalance();
        const tx = await (await taskAgreement
            .connect(thirdParty)
            .approveTask(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        const providerBalanceAfter = await provider.getBalance();
        const providerBalanceDelta = providerBalanceAfter.sub(providerBalanceBefore);
        const thirdPartyBalanceAfter = await thirdParty.getBalance();
        const thirdPartyBalanceDelta = thirdPartyBalanceAfter.sub(thirdPartyBalanceBefore);
        const commission = await taskAgreement.commission();
        const thirdPartyCommission = task.price.mul(commission).div(100);
        const newTxPrice = task.price.sub(thirdPartyCommission);
        const gasUsed = tx.effectiveGasPrice.mul(tx.gasUsed);

        // Need to replicate this for disapproving dispute.thirdparty
        expect(providerBalanceDelta).to.equal(newTxPrice);
        expect(thirdPartyBalanceDelta.add(gasUsed)).to.equal(thirdPartyCommission);
        expect(task.completed).to.be.true;
        expect(task.thirdParty.approved).to.be.true;
    })

    it("Should NOT allow function to be called on a completed task", async () => {
        const taskId = taskIds[0];
        await expect(
            taskAgreement.connect(consumer)
                .addEvidence(taskId, "Evidence")
        ).to.revertedWith("This task has already been completed");
        await expect(
            taskAgreement.connect(consumer)
                .approveTask(taskId)
        ).to.be.revertedWith("This task has already been completed")
        await expect(
            taskAgreement.connect(consumer)
                .disapproveTask(taskId)
        ).to.be.revertedWith("This task has already been completed")
        await expect(
            taskAgreement.connect(consumer)
                .assignThirdParty(taskId)
        ).to.be.revertedWith("This task has already been completed")
    })
})