import { upgrades, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("AdminBoxOwnable", () => {
    let owner: Signer;
    let imposter: Signer;
    let box: Contract;

    beforeEach(async () => {
        [owner, imposter] = await ethers.getSigners();
        const ownerAddress = await owner.getAddress();

        const Box = await ethers.getContractFactory("AdminBoxOwnable");
        //console.log("Deploying AdminBox...");
        box = await upgrades.deployProxy(Box, [], { initializer: 'initialize' });

        await box.deployed();
        //console.log("AdminBox deployed to:", box.address);
    });

    describe("deployment", async () => {
        it("should set the owner", async () => {
            let ownerAddress: string = await owner.getAddress();
            await expect(await box.owner()).to.eq(ownerAddress);
        });
    });

    describe("owner access", async () => {
        it("should allow the owner to store values", async () => {
            await expect(await box.store(123)).to.emit(box, "ValueChanged").withArgs(123);
            await expect(await box.retrieve()).to.eq(123);
        });

        it("should reject imposters that store values", async () => {
            let con = box.connect(imposter);
            //let ownerAddress: string = await owner.getAddress();
            // employer should be able to send more ether to the contract
            await expect(con.store(123)).to.revertedWith("Ownable: caller is not the owner");
        });
    });
});