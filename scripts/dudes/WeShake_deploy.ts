import { ethers, deployments, upgrades } from "hardhat";
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
  
  const WeShake = await ethers.getContractFactory("WeShake");
  const shake = await upgrades.deployProxy(WeShake, [], { initializer: 'initialize' });

  // The contract is NOT deployed yet we must wait until it is mined
  await shake.deployed();

  const artifact = await deployments.getArtifact("WeShake");
  const data = {
    address: shake.address,
    abi: artifact.abi 
  };

  console.log(data);

  // save the abi for frontend use
  const file = "frontend-sveltekit/config/WeShake.json";
  fs.writeFileSync(file, JSON.stringify(data));
  console.log('output:', file);
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });