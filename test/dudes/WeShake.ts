import { upgrades, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("WeShake", () => {
    let owner: Signer;
    let imposter: Signer;
    let shake: Contract;

    beforeEach(async () => {
        [owner, imposter] = await ethers.getSigners();
        const ownerAddress = await owner.getAddress();

        const Box = await ethers.getContractFactory("WeShake");
        //console.log("Deploying AdminBox...");
        shake = await upgrades.deployProxy(Box, [], { initializer: 'initialize' });

        await shake.deployed();
        //console.log("AdminBox deployed to:", box.address);
    });

    describe("deployment", async () => {
        it("should set the owner", async () => {
            let ownerAddress: string = await owner.getAddress();
            await expect(await shake.owner()).to.eq(ownerAddress);
        });
    });

    describe("owner should be able to agree", async () => {
        it("should revert if the contract terms are not defined", async () => {
            await expect(shake.agree("Tester", "One")).to.revertedWith("contract terms are undefined");
        });

    //    it("should reject imposters that store values", async () => {
    //        let con = box.connect(imposter);
    //        //let ownerAddress: string = await owner.getAddress();
    //        // employer should be able to send more ether to the contract
    //        await expect(con.store(123)).to.revertedWith("Ownable: caller is not the owner");
    //    });
    });
});