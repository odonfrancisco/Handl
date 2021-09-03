// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const parseEther = hre.ethers.utils.parseEther;

const vendorEvidence = [
  "https://www.acutaboveexteriors.com/wp-content/uploads/2020/05/file-3.jpg",
  "https://www.sempersolaris.com/wp-content/uploads/2018/08/roof-1-760x340.jpg",
  "https://thumbs.dreamstime.com/z/old-bad-curling-roof-shingles-house-home-here-comes-another-expensive-improvement-project-contractor-going-41165426.jpg"
];
const clientEvidence = [
  "http://www.homebyhomeexteriors.com/wp-content/uploads/2014/04/photo-5.jpg",
  "http://gjkeller.com/wp-content/uploads/2017/05/when-roofing-goes-wrong-1.jpg",
  "https://durhamnc.stormguardrc.com/wp-content/uploads/sites/59/2019/04/Before-After-Roofing-Townhomes-Brier-Creek.jpg"
];

const pizzaVendor = [
  "https://thumbor.forbes.com/thumbor/fit-in/1200x0/filters%3Aformat%28jpg%29/https%3A%2F%2Fspecials-images.forbesimg.com%2Fimageserve%2F5f974a4f5210e336503abf92%2F0x0.jpg",
  "https://www.aims.ca/wp-content/uploads/2017/09/pizza-man-300x200.jpg",
]
const pizzaClient = [
  "https://static.independent.co.uk/s3fs-public/thumbnails/image/2017/06/30/10/istock-501964582-0.jpg",
  ""
]

const storeFrontVendor = [
  "https://image.shutterstock.com/image-vector/3d-vector-illustration-stock-price-260nw-22261774.jpg"
]
const storeFrontClient = [
  "https://binaries.templates.cdn.office.net/support/templates/en-us/lt03934533_quantized.png"
]

const woodDeskVendor = [
  "https://sethrolland.com/wp-content/uploads/2015/07/Trimerous-Desk-1280x853-c-default.jpg",
]

const taskDescriptions = [
  "Replace Roof Tiles",
  "Pizza Order in 1 hour or less",
  "Reduce Storefront Overhead by 20%",
  "Custom Wood Desk"
]
const prices = [
  '12',
  '3',
  '45',
  '2'
]
const expirationTimes = [
  432000,
  3600,
  600000,
  50000012
]


async function main() {
  const TaskAgreement = await hre.ethers.getContractFactory("TaskAgreement");
  const taskAgreement = await TaskAgreement.deploy();

  await taskAgreement.deployed();
  const signers = await hre.ethers.getSigners();
  const client = signers[0];
  const vendor = signers[1];
  const thirdParty = signers[2];
  const vendorAddress = signers[1].address;

  const taskIds = [];

  for(let i=0; i < prices.length; i++) {
    const tx = await (await taskAgreement.createTask(
      vendorAddress, 
      taskDescriptions[i], 
      expirationTimes[i], 
      {value: parseEther(prices[i])}
    )).wait();
    taskIds.push(tx.events[0].args.id);
  }

  for(let i = 0; i < taskIds.length; i++) { 
    const taskId = taskIds[i];
    for(let e = 0; e < vendorEvidence.length; e++) {
      await taskAgreement.connect(signers[0]).addEvidence(taskId, clientEvidence[e]);
      await taskAgreement.connect(signers[1]).addEvidence(taskId, vendorEvidence[e]);  
    }
  }
  // brings tasks up to dispute.thirdparty
  for(let i = 0; i < taskIds.length; i++){
    const taskId = taskIds[i];
    await (await taskAgreement.connect(vendor)
      .approveTask(taskId)).wait()
    await (await taskAgreement.connect(client)
        .disapproveTask(taskId)).wait()
    await (await taskAgreement.connect(vendor)
        .approveTask(taskId)).wait()
    await (await taskAgreement.connect(client)
        .disapproveTask(taskId)).wait()
    if(i % 2 === 0) {
      await (await taskAgreement.connect(thirdParty)
          .assignThirdParty(taskId)).wait()
    }
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
