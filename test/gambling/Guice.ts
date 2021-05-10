import { upgrades, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Signer } from "ethers";
import { Guice } from "../../typechain/Guice";

chai.use(solidity);
const { expect } = chai;

describe("Guice", () => {
    let owner: Signer;
    let user1: Signer;
    let user2: Signer;
    let guice: Guice;

    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners();
        const juice = await ethers.getContractFactory("Guice");
        guice = await upgrades.deployProxy(juice, [], { initializer: 'initialize' }) as Guice;
        await guice.deployed();
    });

    describe("deployment", async () => {
        it("should set the owner", async () => {
            let ownerAddress: string = await owner.getAddress();
            await expect(await guice.owner()).to.eq(ownerAddress);
        });
    });
});