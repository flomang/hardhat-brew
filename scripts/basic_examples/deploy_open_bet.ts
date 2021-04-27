import { ethers } from "hardhat";
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
  // The contract is NOT deployed yet; we must wait until it is mined
  await openBet.deployed();

  // note: this abi does not work for some reason
  // use the compiled abi in the artifacts dir instead
  const abi = JSON.parse(openBet.interface.format('json').toString());
  const data = {
    address: openBet.address,
    abi: abi 
  };

  console.log(data);
  const file = "frontend-svelte/config/OpenBet.json";
  // save the abi for frontend use
  fs.writeFileSync(file, JSON.stringify(data));
  console.log('output:', file);
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });