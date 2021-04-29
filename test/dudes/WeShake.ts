import { upgrades, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("WeShake", () => {
    let owner: Signer;
    let person1: Signer;
    let person2: Signer;
    let shake: Contract;

    beforeEach(async () => {
        [owner, person1, person2] = await ethers.getSigners();
        const WeShake = await ethers.getContractFactory("WeShake");
        shake = await upgrades.deployProxy(WeShake, [], { initializer: 'initialize' });
        await shake.deployed();
    });

    describe("deployment", async () => {
        it("should set the owner", async () => {
            let ownerAddress: string = await owner.getAddress();
            await expect(await shake.owner()).to.eq(ownerAddress);
        });
    });

    describe("the owner", async () => {
        it("agree should revert if the contract terms are not defined", async () => {
            await expect(shake.agree("Tester", "One")).to.revertedWith("contract terms are undefined");
        });

        it("should be able to set the terms", async () => {
            let con = shake.connect(owner);
            //let ownerAddress: string = await owner.getAddress();
            // employer should be able to send more ether to the contract
            await expect(await con.setTerms("Some terms!")).to.emit(shake, "NewTermsSet").withArgs("Some terms!");
        });
    });

    describe("non owner", async () => {
        it("can't set terms", async () => {
            let con = shake.connect(person1);
            //let ownerAddress: string = await owner.getAddress();
            // employer should be able to send more ether to the contract
            await expect(con.setTerms("Some terms!")).to.revertedWith("Ownable: caller is not the owner");
        });

        it("can agree to terms", async () => {
            const con1 = shake.connect(owner); 
            const con2 = shake.connect(person1);
            const person1Address = await person1.getAddress();

            await expect(await con1.setTerms("Some terms!")).to.emit(shake, "NewTermsSet").withArgs("Some terms!");

            //let ownerAddress: string = await owner.getAddress();
            // employer should be able to send more ether to the contract
            await expect(await con2.agree("Keanu", "Willis")).to.emit(shake, "PersonAgreed").withArgs("Keanu", "Willis", person1Address);
        });
    });
});