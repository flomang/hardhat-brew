import { upgrades, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("Box", () => {
    let owner: Signer;
    let imposter: Signer;
    let box: Contract;

    beforeEach(async () => {
        [owner, imposter] = await ethers.getSigners();

        const Box = await ethers.getContractFactory("Box");
        //console.log("Deploying Box...");
        box = await upgrades.deployProxy(Box, [42], { initializer: 'store' });

        await box.deployed();
        //console.log("Box deployed to:", box.address);
    });

    describe("deployment", async () => {
        it("should set the original value", async () => {
            await expect(await box.retrieve()).to.eq(42);
        });
    });

    describe("functions", async () => {
        it("should upgrade", async () => {
            const BoxV2 = await ethers.getContractFactory("BoxV2");
            //console.log("Upgrading Box...");

            const box2 = await upgrades.upgradeProxy(box.address, BoxV2);
            expect(box2.address).to.eq(box.address)
            //console.log("Box upgraded");
        });

        it("should allow a user to store values", async () => {
            await expect(await box.store(123)).to.emit(box, "ValueChanged").withArgs(123);
            await expect(await box.retrieve()).to.eq(123);
        });
    });
});