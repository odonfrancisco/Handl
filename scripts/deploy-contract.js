// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const parseEther = hre.ethers.utils.parseEther;

const roofVendor = [
  "https://www.acutaboveexteriors.com/wp-content/uploads/2020/05/file-3.jpg",
  "https://www.sempersolaris.com/wp-content/uploads/2018/08/roof-1-760x340.jpg",
  "https://durhamnc.stormguardrc.com/wp-content/uploads/sites/59/2019/04/Before-After-Roofing-Townhomes-Brier-Creek.jpg"
];
const roofClient = [
  "http://www.homebyhomeexteriors.com/wp-content/uploads/2014/04/photo-5.jpg",
  "http://gjkeller.com/wp-content/uploads/2017/05/when-roofing-goes-wrong-1.jpg",
  "https://thumbs.dreamstime.com/z/old-bad-curling-roof-shingles-house-home-here-comes-another-expensive-improvement-project-contractor-going-41165426.jpg"
];

const pizzaVendor = [
  "https://thumbor.forbes.com/thumbor/fit-in/1200x0/filters%3Aformat%28jpg%29/https%3A%2F%2Fspecials-images.forbesimg.com%2Fimageserve%2F5f974a4f5210e336503abf92%2F0x0.jpg",
  "https://www.aims.ca/wp-content/uploads/2017/09/pizza-man-300x200.jpg",
]
const pizzaClient = [
  "https://static.independent.co.uk/s3fs-public/thumbnails/image/2017/06/30/10/istock-501964582-0.jpg",
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

const lawnClient = [
  "https://c8.alamy.com/comp/J2PYME/very-badly-laid-turf-grass-lawn-which-hasnt-bonded-with-the-stony-J2PYME.jpg",
  "https://i.stack.imgur.com/o2JDE.jpg"
]

const lawnVendor = [
  "https://contentgrid.thdstatic.com/hdus/en_US/DTCCOMNEW/Articles/how-to-mow-a-lawn-hero.jpg",
  "https://monstermowing.com/wp-content/uploads/2011/10/GreenLawn.jpg"
]

const evidenceArr = [
  {
    vendor: roofVendor,
    client: roofClient
  },
  {
    vendor: pizzaVendor,
    client: pizzaClient
  },
  {
    vendor: storeFrontVendor,
    client: storeFrontClient
  },
  {
    vendor: woodDeskVendor,
    client: []
  },
  {
    vendor: lawnVendor,
    client: lawnClient
  }
]

const taskDescriptions = [
  "Replace Roof Tiles",
  "Pizza Order in 1 hour or less",
  "Reduce Storefront Overhead by 20%",
  "Custom Wood Desk",
  "Mow Lawn"
]
const prices = [
  '1.3',
  '.05',
  '4',
  '2',
  '.08'
]
const expirationTimes = [
  432000,
  3600,
  600000,
  50000012,
  66000
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
    const vendorEvidence = evidenceArr[i].vendor;
    const clientEvidence = evidenceArr[i].client;

    let e;
    for(e = 0; e < vendorEvidence.length ; e++) {
      const evidence = vendorEvidence[e];
      await taskAgreement.connect(vendor).addEvidence(taskId, evidence);
    }
    for(e = 0; e < clientEvidence.length ; e++) {
      const evidence = clientEvidence[e];
      await taskAgreement.connect(client).addEvidence(taskId, evidence);
    }
  }
  // brings tasks up to dispute.thirdparty
  for(let i = 0; i < taskIds.length; i++){
    const taskId = taskIds[i];
    await (await taskAgreement.connect(vendor)
      .approveTask(taskId)).wait()
    if(i === 3) continue;
    await (await taskAgreement.connect(client)
        .disapproveTask(taskId)).wait()
    if(i === 2) continue;
    await (await taskAgreement.connect(vendor)
        .approveTask(taskId)).wait()
    if(i === 0) {
      await (await taskAgreement.connect(client)
        .approveTask(taskId)).wait()
      continue;
    }
    await (await taskAgreement.connect(client)
        .disapproveTask(taskId)).wait()
    if(i === 4) {
      await (await taskAgreement.connect(thirdParty)
          .assignThirdParty(taskId)).wait()
      await (await taskAgreement.connect(thirdParty)
          .disapproveTask(taskId)).wait()
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
