import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const factory = await ethers.getContractFactory("Token");
  const contract = await factory.deploy();

  console.log("Contract address:", contract.address);
  console.log("Deploy hash:", contract.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await contract.deployed();
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });