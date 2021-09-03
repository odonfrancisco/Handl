const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { parseEther, formatEther } = ethers.utils;

// Dispute Enum
const dispute = {
    None: 0,
    Internal: 1,
    ThirdParty: 2
}

let taskDescriptions = ["Test Task", "Test 2", "Test 3", "Test 4", "Test 5", "Test 6", "Test 7"];
let vendorEvidence = [
    "https://www.acutaboveexteriors.com/wp-content/uploads/2020/05/file-3.jpg",
    "https://www.sempersolaris.com/wp-content/uploads/2018/08/roof-1-760x340.jpg"
];
let clientEvidence = [
    "http://www.homebyhomeexteriors.com/wp-content/uploads/2014/04/photo-5.jpg",
    "http://gjkeller.com/wp-content/uploads/2017/05/when-roofing-goes-wrong-1.jpg"
];
let prices = [35, 49, 43, 26, 13, 7, 8];
const expirationTimes = [3600, 3600, 3600, 3600, 3600, 3600, 15]
const reducer = (accumulator, currentValue) => accumulator + currentValue;

/* I'm testing a singular task throughout separate test
instead of testing an independent task per test. 
don't know if this is ok or if i should be testing an independent task per test.*/

describe("TaskAgreement", () => {
    let client, vendor, thirdParty;
    let taskAgreement;
    let taskIds = [];

    before(async () => {
        const taskAgreementContract = await ethers.getContractFactory("TaskAgreement");
        taskAgreement = await taskAgreementContract.deploy();
        await taskAgreement.deployed();
        [client, vendor, thirdParty] = await ethers.getSigners();
    })
    
    it("Should create tasks successfully", async () => {
        const emittedTasks = [];

        for(let i = 0; i < prices.length; i++){
            const createTaskTx = await 
                (await taskAgreement
                    .connect(client)
                    .createTask(
                        vendor.address, 
                        taskDescriptions[i], 
                        expirationTimes[i],
                        {value: parseEther(prices[i].toString())}
                    )).wait();
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
            expect(currentTask.vendor.to).to.equal(vendor.address);
            expect(currentTask.client.to).to.equal(client.address);
            expect(currentTask.id).to.equal(i);
            expect(currentTask.dispute).to.equal(dispute.None);
            expect(newTask.price).to.equal(currentTask.price);
            expect(newTask.description).to.equal(currentTask.description);
            expect(newTask.vendor.to).to.equal(currentTask.vendor.to);
            expect(newTask.client.to).to.equal(currentTask.client.to);
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
        await (await taskAgreement.connect(vendor)
            .approveTask(taskId)).wait()
        await (await taskAgreement.connect(client)
            .disapproveTask(taskId)).wait()
        await (await taskAgreement.connect(vendor)
            .approveTask(taskId)).wait()
        // have to bring 4rd task all the way up to dispute.internal
        taskId = taskIds[3];
        await (await taskAgreement.connect(vendor)
            .approveTask(taskId)).wait()
        await (await taskAgreement.connect(client)
            .disapproveTask(taskId)).wait()
        await (await taskAgreement.connect(vendor)
            .approveTask(taskId)).wait()
        // have to bring 5th task all the way up to dispute.thirdParty
        taskId = taskIds[4];
        await (await taskAgreement.connect(vendor)
            .approveTask(taskId)).wait()
        await (await taskAgreement.connect(client)
            .disapproveTask(taskId)).wait()
        await (await taskAgreement.connect(vendor)
            .approveTask(taskId)).wait()
        await (await taskAgreement.connect(client)
            .disapproveTask(taskId)).wait()
        await (await taskAgreement.connect(thirdParty)
            .assignThirdParty(taskId)).wait()
    })

    it("Should getUserTasks()", async () => {
        const userTasks = await taskAgreement.getUserTasks();
        expect(userTasks.length).to.equal(prices.length);
    })

    it("Should NOT expire task before set time", async () => {
        const taskId = taskIds[6];
        await (await taskAgreement.connect(client)
            .expireTask(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        expect(task.completed).to.be.false;
    })

    // it("Should expire task after set time", async () => {
    //     const taskId = taskIds[6];
    //     await Promise.all([
    //         new Promise(resolve => setTimeout(resolve, 16000))
    //     ])
    //     const clientBalanceBefore = await client.getBalance();
    //     const tx = await (await taskAgreement.connect(client)
    //         .expireTask(taskId)).wait();
    //     const task = await taskAgreement.getTask(taskId);
    //     const clientBalanceAfter = await client.getBalance();
    //     const balanceDelta = clientBalanceAfter.sub(clientBalanceBefore);
    //     const gasUsed = tx.effectiveGasPrice.mul(tx.gasUsed);
    //     expect(task.completed).to.be.true;
    //     expect(balanceDelta).to.equal(task.price.sub(gasUsed));
    // })

    it("Should NOT create task if description not valid length", async () => {
        await expect(
            taskAgreement.createTask(vendor.address, "", 15, {value: parseEther('35')})
        ).to.be.revertedWith("String argument must be of valid length")
    })

    it("Should NOT create task if no value is sent", async () => {
        await expect(
            taskAgreement.createTask(vendor.address, taskDescriptions[0], 15)
        ).to.be.revertedWith("Must send ether to execute function")
    })

    it("Should NOT create task if no expirationdate is passed", async () => {
        await expect(
            taskAgreement.createTask(vendor.address, taskDescriptions[0], 0, {value: parseEther('35')})
        ).to.be.revertedWith("Must pass a valid expiration date")
    })

    it("Should NOT create task if vendor === client", async () => {
        await expect(
            taskAgreement.createTask(client.address, taskDescriptions[0], 15, {value: parseEther('22')})
        ).to.be.revertedWith("Vendor & Client addresses should be distinct");
    })

    it("Should NOT create task if vendor === smartContract address", async () => {
        await expect(
            taskAgreement.createTask(taskAgreement.address, taskDescriptions[0], 17, {value: parseEther('22')})
        ).to.be.revertedWith("This smart contract can not be a task vendor");
    })

    it("Should add funds to task correctly", async () => {
        const taskId = taskIds[2];
        let task = (await taskAgreement.getTask(taskId));
        const prevTaskPrice = task.price;
        await (await taskAgreement.connect(client)
            .addFunds(taskId, {value: parseEther('12')})).wait();
        task = await taskAgreement.getTask(taskId);
        const newTaskPrice = task.price;
        expect(newTaskPrice).to.equal(prevTaskPrice.add(ethers.BigNumber.from(parseEther('12')))); 
    })

    it("Should NOT add funds to task if not client", async () => {
        const taskId = taskIds[0];
        await expect(
            taskAgreement.connect(thirdParty)
                .addFunds(taskId, {value: parseEther('12')})
        ).to.be.revertedWith("Only the client of this task may add funds")
        await expect(
            taskAgreement.connect(vendor)
                .addFunds(taskId, {value: parseEther('12')})
        ).to.be.revertedWith("Only the client of this task may add funds")
    })

    it("Should NOT add funds if no eth was received", async () => {
        const taskId = taskIds[0];
        await expect(
            taskAgreement.connect(client)
                .addFunds(taskId)
        ).to.be.revertedWith("Must send ether to execute function")
    })
    
    it("Should NOT add funds if invalid taskId passed", async () => {
        await expect(
            taskAgreement.connect(client)
                .addFunds(999, {value: parseEther('12')})
        ).to.be.revertedWith("Must pass a valid task ID")
    })

    // it("Should NOT add funds + return msg.value if task is expired", async () => {
    //     const clientBalanceBefore = await client.getBalance();
    //     const initialEth = parseEther('8');
    //     const tx = await (await taskAgreement.createTask(
    //         vendor.address,
    //         "Chreast",
    //         15,
    //         {value: initialEth}
    //     )).wait();
    //     const taskId = tx.events[0].args.id;
    //     const addedEth = parseEther('12');
    //     await Promise.all([
    //         new Promise(resolve => setTimeout(resolve, 16000))
    //     ])
    //     const tx2 = await (await taskAgreement.addFunds(taskId, {value: addedEth})).wait();
    //     const clientBalanceAfter = await client.getBalance();
    //     const ethUsed = tx.effectiveGasPrice.mul(tx.gasUsed);
    //     const ethUsed2 = tx2.effectiveGasPrice.mul(tx2.gasUsed);
    //     const clientBalanceAfterPlusGas = clientBalanceAfter.add(ethUsed).add(ethUsed2);
    //     expect(clientBalanceAfterPlusGas.eq(clientBalanceBefore), 
    //         "Expect clientBalance to equal balance before creating task")
    // })

    it("Should add time correctly", async () => {
        const taskId = taskIds[0];
        const timeToAdd = ethers.BigNumber.from(1020);
        let task = await taskAgreement.getTask(taskId);
        const initialExpiration = task.expiration;
        await (await taskAgreement.connect(client)
            .addTime(taskId, timeToAdd)).wait();
        task = await taskAgreement.getTask(taskId);
        const newExpiration = task.expiration;
        expect(newExpiration).to.equal(initialExpiration.add(timeToAdd));
    })

    it("Should NOT add time if invalid time parameter", async () => {
        const taskId = taskIds[0];
        await expect(
            taskAgreement.connect(client)
                .addTime(taskId, 0)
        ).to.be.revertedWith("Must pass a valid expiration date")
        await expect(
            taskAgreement.connect(client)
                .addTime(taskId, -2)
        ).to.be.reverted;
    })

    it("Should NOT add time if invalid taskId passed", async () => {
        await expect(
            taskAgreement.connect(client)
                .addTime(999, 42)
        ).to.be.revertedWith("Must pass a valid task ID");
    })

    it("Should NOT add time if not client", async () => {
        const taskId = taskIds[0];
        await expect(
            taskAgreement.connect(vendor)
                .addTime(taskId, 55)
        ).to.be.revertedWith("Only the client of this task may add expiration time");
        await expect(
            taskAgreement.connect(thirdParty)
                .addTime(taskId, 55)
        ).to.be.revertedWith("Only the client of this task may add expiration time");
    })

    it("Should add evidence to task correctly", async () => {
        const [evidence, evidence2] = vendorEvidence;
        await taskAgreement
            .connect(vendor)
            .addEvidence(taskIds[0], evidence);
        let task = await taskAgreement.getTask(taskIds[0]);
        expect(task.vendor.evidence.length).to.equal(1); 
        expect(task.vendor.evidence[0]).to.equal(evidence);

        await taskAgreement.connect(client)
            .addEvidence(taskIds[0], evidence2);
        task = await taskAgreement.getTask(taskIds[0]);
        expect(task.client.evidence.length).to.equal(1); 
        expect(task.client.evidence[0]).to.equal(evidence2);
    })

    it("Should NOT add evidence if string parameter empty", async () => {
        await expect(
            taskAgreement.connect(client)
                .addEvidence(taskIds[0], "")
        ).to.be.revertedWith("String argument must be of valid length")
    })

    it("Should NOT add evidence to task if not client or vendor of task", async () => {
        await expect(
            taskAgreement.connect(thirdParty)
                .addEvidence(taskIds[0], "Chruast")
        ).to.be.revertedWith("Can not interact with a task you're not a part of")
    })

    it("Should NOT approve task.DISPUTE.NONE by client initially", async () => {
        await expect(
            taskAgreement.connect(client)
                .approveTask(taskIds[0])
        ).to.be.revertedWith("Vendor must approve task before you can approve eth transfer")
    })

    it("Should approve task.DISPUTE.NONE by vendor initially", async () => {
        await (await taskAgreement.connect(vendor)
            .approveTask(taskIds[0])).wait();
        const task = await taskAgreement.getTask(taskIds[0]);
        expect(task.vendor.approved).to.be.true;
    })

    it("Should NOT approve task.DISPUTE.NONE by vendor twice", async () => {
        // task was already approved by vendor in previous test
        await expect(
            taskAgreement.connect(vendor)
                .approveTask(taskIds[0])
        ).to.be.revertedWith("You can not approve a task twice");
    })

    it("Should approve task.DISPUTE.NONE by client and send eth to vendor", async () => {
        const vendorBalanceBefore = await vendor.getBalance();
        await (await taskAgreement.connect(client)
            .approveTask(taskIds[0])).wait();
        const task = await taskAgreement.getTask(taskIds[0]);
        const vendorBalanceAfter = await vendor.getBalance();
        const balanceDelta = vendorBalanceAfter.sub(vendorBalanceBefore);
        expect(task.client.approved).to.be.true;
        expect(balanceDelta).to.equal(task.price);
        expect(task.vendor.approved).to.be.true;
        expect(task.completed).to.be.true;
    })

    it("Should NOT approve task.DISPUTE.NONE by client twice", async () => {
        await expect(
            taskAgreement.connect(client)
                .approveTask(taskIds[0])
        ).to.be.revertedWith("This task has already been completed");        
    })

    it("Should disapprove task.DISPUTE.NONE by vendor and return eth to client", async () => {
        const clientBalanceBefore = await client.getBalance();
        await (await taskAgreement.connect(vendor)
            .disapproveTask(taskIds[5])).wait();
        const clientBalanceAfter = await client.getBalance();
        const balanceDelta = clientBalanceAfter.sub(clientBalanceBefore);
        const task = await taskAgreement.getTask(taskIds[5]);
        expect(balanceDelta).to.be.equal(task.price);
        expect(task.completed).to.be.true;
        expect(task.vendor.approved).to.be.false;
    })

    it("Should NOT disapprove task.DISPUTE.NONE by client before vendor has chance to approve", async () => {
        await expect(
            taskAgreement.connect(client)
                .disapproveTask(taskIds[1])
        ).to.be.revertedWith("Vendor must approve task on their end before you can open a dispute")
    })

    it("Should disapprove task.DISPUTE.NONE by client after vendor has approved task", async () => {
        const taskId = taskIds[1];
        await (await taskAgreement.connect(vendor)
            .approveTask(taskId)).wait();
        await (await taskAgreement.connect(client)
            .disapproveTask(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        expect(task.dispute).to.equal(dispute.Internal);
        expect(task.client.approved).to.false;
        expect(task.vendor.approved).to.false;
    })

    it("Should NOT disapprove task.DISPUTE.INTERNAL by client before vendor approves", async () => {
        const taskId = taskIds[1];
        await expect(
            taskAgreement.connect(client)
                .disapproveTask(taskId)
        ).to.be.revertedWith("Vendor must approve task on their end before you can open a dispute")
    })

    it("Should disapprove task.DISPUTE.INTERNAL by vendor and send eth back to client", async () => {
        const taskId = taskIds[1];
        const clientBalanceBefore = await client.getBalance();
        await (await taskAgreement.connect(vendor)
            .disapproveTask(taskId)).wait();

        const task = await taskAgreement.getTask(taskId);
        const taskPrice = formatEther(task.price);
        const clientBalanceAfter = await client.getBalance();

        expect(task.completed).to.be.true;
        expect(clientBalanceAfter.sub(clientBalanceBefore))
            .to.equal(parseEther(taskPrice))
    })

    it("Should NOT assign third party at task.DISPUTE.INTERNAL", async () => {
        const taskId = taskIds[2];
        await expect(
            taskAgreement.connect(thirdParty)
                .assignThirdParty(taskId)
        ).to.revertedWith("Cannot assign a third party to this task until internally decided");
    })

    it("Should disapprove task.DISPUTE.INTERNAL by client", async () => {
        const taskId = taskIds[2];
        await (await taskAgreement.connect(client)
            .disapproveTask(taskId)).wait()
        const task = await taskAgreement.getTask(taskId);
        expect(task.dispute).to.equal(dispute.ThirdParty)
    })

    it("Should approve task.DISPUTE.INTERNAL by client & send eth to vendor", async () => {
        const taskId = taskIds[3];
        const vendorBalanceBefore = await vendor.getBalance();
        await (await taskAgreement.connect(client)
            .approveTask(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        const vendorBalanceAfter = await vendor.getBalance();
        const balanceDelta = vendorBalanceAfter.sub(vendorBalanceBefore);
        expect(balanceDelta).to.equal(task.price);
        expect(task.client.approved).to.be.true;
        expect(task.vendor.approved).to.be.true;
        expect(task.completed).to.be.true;
        expect(task.dispute).to.equal(dispute.Internal);
    })

    it("Should NOT dissaprove||approve task.DISPUTE.THIRDPARTY if not third party", async () => {
        const taskId = taskIds[2];
        await (expect(
            taskAgreement.connect(vendor)
                .approveTask(taskId)
        ).to.revertedWith("Only the third party may make a decision at this stage of dispute"))
        await (expect(
            taskAgreement.connect(client)
                .disapproveTask(taskId)
        ).to.revertedWith("Only the third party may make a decision at this stage of dispute"))
    })

    it("Should NOT assign third party if not valid task ID", async () => {
        await expect(
            taskAgreement.connect(thirdParty)
                .assignThirdParty(9813)
        ).to.revertedWith("Must pass a valid task ID");
    })

    it("Should NOT assign third party if thirdParty == client || vendor", async () => {
        const taskId = taskIds[2];
        await expect(
            taskAgreement.connect(client)
                .assignThirdParty(taskId)
        ).to.be.revertedWith("Third party can not already be connected to this task");
        await expect(
            taskAgreement.connect(vendor)
                .assignThirdParty(taskId)
        ).to.be.revertedWith("Third party can not already be connected to this task");
    })

    it("Should assign third party to task.DISPUTE.THIRDPARTY", async () => {
        const taskId = taskIds[2];
        let disputedTasks = await taskAgreement.getDisputedTasks();
        let filteredTaskRefs = disputedTasks.filter(task => task.id.eq(taskId));
        expect(filteredTaskRefs.length).to.equal(1);
        await (await taskAgreement.connect(thirdParty)
            .assignThirdParty(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        const userTasks = await taskAgreement.connect(thirdParty)
            .getUserTasks();
        disputedTasks = await taskAgreement.getDisputedTasks();
        filteredTaskRefs = disputedTasks.filter(task => task.id.eq(taskId));
        expect(task.thirdParty.to).to.equal(thirdParty.address);
        expect(filteredTaskRefs.length).to.equal(0);
        expect(userTasks[userTasks.length-1].id).to.equal(task.id);
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

        await taskAgreement.connect(client)
            .addEvidence(taskId, "yeeyee");
        task = await taskAgreement.getTask(taskId);
        expect(task.client.evidence.length).to.equal(1); 
        expect(task.client.evidence[0]).to.equal("yeeyee");

        await taskAgreement.connect(vendor)
            .addEvidence(taskId, "yeeyee");
        task = await taskAgreement.getTask(taskId);
        expect(task.vendor.evidence.length).to.equal(1); 
        expect(task.vendor.evidence[0]).to.equal("yeeyee");
    })

    /* if i were to include a voting feature instead of just one thirdParty, 
     would need another test to test that it's not assigning same third party twice */
    
    it("Should disapprove task.DISPUTE.THIRDPARTY as thirdParty", async () => {
        const taskId = taskIds[2];
        const clientBalanceBefore = await client.getBalance();
        const thirdPartyBalanceBefore = await thirdParty.getBalance();
        const tx = await (await taskAgreement
            .connect(thirdParty)
            .disapproveTask(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        // am supposed to be checking this once task.thirdParty is assigned
        const clientBalanceAfter = await client.getBalance();
        const clientBalanceDelta = clientBalanceAfter.sub(clientBalanceBefore);
        const thirdPartyBalanceAfter = await thirdParty.getBalance();
        const thirdPartyBalanceDelta = thirdPartyBalanceAfter.sub(thirdPartyBalanceBefore);
        const commission = await taskAgreement.commission();
        const thirdPartyCommission = task.price.mul(commission).div(100);
        const newTaskPrice = task.price.sub(thirdPartyCommission);
        const gasUsed = tx.effectiveGasPrice.mul(tx.gasUsed);

        expect(clientBalanceDelta).to.equal(newTaskPrice);
        expect(thirdPartyBalanceDelta.add(gasUsed)).to.equal(thirdPartyCommission);
        expect(task.completed).to.be.true;
    })

    it("Should approve task.DISPUTE.THIRDPARTY as thirdParty", async () => {
        const taskId = taskIds[4];
        const vendorBalanceBefore = await vendor.getBalance();
        const thirdPartyBalanceBefore = await thirdParty.getBalance();
        const tx = await (await taskAgreement
            .connect(thirdParty)
            .approveTask(taskId)).wait();
        const task = await taskAgreement.getTask(taskId);
        const vendorBalanceAfter = await vendor.getBalance();
        const vendorBalanceDelta = vendorBalanceAfter.sub(vendorBalanceBefore);
        const thirdPartyBalanceAfter = await thirdParty.getBalance();
        const thirdPartyBalanceDelta = thirdPartyBalanceAfter.sub(thirdPartyBalanceBefore);
        const commission = await taskAgreement.commission();
        const thirdPartyCommission = task.price.mul(commission).div(100);
        const newTaskPrice = task.price.sub(thirdPartyCommission);
        const gasUsed = tx.effectiveGasPrice.mul(tx.gasUsed);

        expect(vendorBalanceDelta).to.equal(newTaskPrice);
        expect(thirdPartyBalanceDelta.add(gasUsed)).to.equal(thirdPartyCommission);
        expect(task.completed).to.be.true;
        expect(task.thirdParty.approved).to.be.true;
    })

    it("Should NOT allow function to be called on a completed task", async () => {
        const taskId = taskIds[0];
        await expect(
            taskAgreement.connect(client)
                .addEvidence(taskId, "Evidence")
        ).to.revertedWith("This task has already been completed");
        await expect(
            taskAgreement.connect(client)
                .approveTask(taskId)
        ).to.be.revertedWith("This task has already been completed")
        await expect(
            taskAgreement.connect(client)
                .disapproveTask(taskId)
        ).to.be.revertedWith("This task has already been completed")
        await expect(
            taskAgreement.connect(client)
                .assignThirdParty(taskId)
        ).to.be.revertedWith("This task has already been completed")
        await expect(
            taskAgreement.connect(client)
                .addFunds(taskId, {value: parseEther('11')})
        ).to.be.revertedWith("This task has already been completed")
        await expect(
            taskAgreement.connect(client)
                .addTime(taskId, 15)
        ).to.be.revertedWith("This task has already been completed")
    })
})