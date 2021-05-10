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

    describe("wagers", async () => {
        it("should be able to be created", async () => {
            let userAddress: string = await user1.getAddress();
            let user1con = guice.connect(user1);
            let desc = "I'm filthy rich!";
            let amount = 10;

            await expect(await user1con.createWager(desc, {value: amount})).to.emit(guice, "WagerCreated").withArgs(userAddress, desc, amount);

            let wager = await user1con.wagers(userAddress);
            expect(wager.fromAddress).to.eq(userAddress);
            expect(wager.amount).to.eq(amount);
            expect(wager.description).to.eq(desc);
        });
    });
});