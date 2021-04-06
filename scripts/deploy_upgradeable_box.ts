import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const factory = await ethers.getContractFactory("Box");
  const contract = await upgrades.deployProxy(factory, [42], { initializer: 'store' });
  await contract.deployed();

  console.log("Contract deployed to address:", contract.address);
  console.log("Deploy hash:", contract.deployTransaction.hash);
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });