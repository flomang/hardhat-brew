import { ethers } from "hardhat";

async function main() {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);

    const address = "0x5fbdb2315678afecb367f032d93f642f64180aa3"
    const Box = await ethers.getContractFactory("Box");
    const box = await Box.attach(address);

    const value = await box.retrieve();
    console.log("Box value is", value.toString());

    await box.store(23);
    const newValue = await box.retrieve();
    console.log("Box value is", newValue.toString());

}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });