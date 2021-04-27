import { ethers, deployments } from "hardhat";
import fs from "fs";

// run this script via: 
// npx hardhat run --network localhost scripts/basic_examples/deploy_open_bet.ts   
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const OpenBet = await ethers.getContractFactory("OpenBet");
  const openBet = await OpenBet.deploy();
  // The contract is NOT deployed yet we must wait until it is mined
  await openBet.deployed();

  const artifact = await deployments.getArtifact("OpenBet");
  const data = {
    address: openBet.address,
    abi: artifact.abi 
  };

  console.log(data);

  // save the abi for frontend use
  const file = "frontend-svelte/config/OpenBet.json";
  fs.writeFileSync(file, JSON.stringify(data));
  console.log('output:', file);
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });