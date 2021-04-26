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

  const data = {
    address: openBet.address,
    abi: JSON.parse(openBet.interface.format('json').toString())
  };

  console.log(data);
  // save the abi for frontend use
  fs.writeFileSync('frontend/abi/OpenBet.json', JSON.stringify(data));

  // The contract is NOT deployed yet; we must wait until it is mined
  await openBet.deployed();

  console.log('deployed!!');
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });