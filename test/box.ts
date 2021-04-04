import hardhat from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer } from "ethers";
import contractJson from "../artifacts/contracts/access-control/Box.sol/Box.json";


chai.use(solidity);
const { expect } = chai;
const { waffle } = hardhat;

describe("Box", () => {
    let owner: Signer;
    let boxContract: Contract;

    beforeEach(async () => {
        let accounts = waffle.provider.getWallets();
        owner = accounts[0];

        boxContract = await waffle.deployContract(owner, contractJson);
    });

    describe("deployment", async () => {
        it("should set the owner", async () => {
            let ownerAddress: string = await owner.getAddress();
            // employer should be able to send more ether to the contract
            await expect(await boxContract.owner()).to.eq(ownerAddress);
        });
    });
});