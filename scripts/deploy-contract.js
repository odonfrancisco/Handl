// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const parseEther = hre.ethers.utils.parseEther;

let providerEvidence = [
  "https://www.acutaboveexteriors.com/wp-content/uploads/2020/05/file-3.jpg",
  "https://www.sempersolaris.com/wp-content/uploads/2018/08/roof-1-760x340.jpg",
  "https://thumbs.dreamstime.com/z/old-bad-curling-roof-shingles-house-home-here-comes-another-expensive-improvement-project-contractor-going-41165426.jpg"
];
let consumerEvidence = [
  "http://www.homebyhomeexteriors.com/wp-content/uploads/2014/04/photo-5.jpg",
  "http://gjkeller.com/wp-content/uploads/2017/05/when-roofing-goes-wrong-1.jpg",
  "https://durhamnc.stormguardrc.com/wp-content/uploads/sites/59/2019/04/Before-After-Roofing-Townhomes-Brier-Creek.jpg"
];

async function main() {
  const TaskAgreement = await hre.ethers.getContractFactory("TaskAgreement");
  const taskAgreement = await TaskAgreement.deploy();

  await taskAgreement.deployed();
  const signers = await hre.ethers.getSigners();
  const providerAddress = signers[1].address;
  const tx = await (await taskAgreement.createTask(
      providerAddress, 
      "Replace Roof Tiles", 
      432000, 
      {value: parseEther('12')}
  )).wait();
  const tx2 = await (await taskAgreement.createTask(
      providerAddress, 
      "Pizza Order in 1 hour or less", 
      3600, 
      {value: parseEther('12')}
  ));
  const taskId = tx.events[0].args.id;

  for(let i = 0; i < providerEvidence.length; i++) {
    await taskAgreement.connect(signers[0]).addEvidence(taskId, consumerEvidence[i]);
    await taskAgreement.connect(signers[1]).addEvidence(taskId, providerEvidence[i]);
  }
  
  console.log("TaskAgreement contract deployed to: ", taskAgreement.address);  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
