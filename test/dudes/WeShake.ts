import { upgrades, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Signer } from "ethers";
import { WeShake, WeShakeInterface } from "../../typechain/WeShake";

chai.use(solidity);
const { expect } = chai;

describe("WeShake", () => {
    let owner: Signer;
    let person1: Signer;
    let person2: Signer;
    let shake: WeShake;

    beforeEach(async () => {
        [owner, person1, person2] = await ethers.getSigners();
        const WeShake = await ethers.getContractFactory("WeShake");
        shake = await upgrades.deployProxy(WeShake, [], { initializer: 'initialize' }) as WeShake;
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
            const ownerAddress = await owner.getAddress();
            await expect(await shake.register("Keanu Willis")).to.emit(shake, "PersonRegistered").withArgs("Keanu Willis", ownerAddress);

            await expect(shake.agree()).to.revertedWith("contract terms are undefined");
        });

        it("should be able to set the terms", async () => {
            let con = shake.connect(owner);
            //let ownerAddress: string = await owner.getAddress();
            // employer should be able to send more ether to the contract
            await expect(await con.setTerms("Some terms!")).to.emit(shake, "NewTermsSet").withArgs("Some terms!");
        });

        it("reset terms after agreement", async () => {
            const con1 = shake.connect(owner); 
            const con2 = shake.connect(person1);
            const ownerAddress = await owner.getAddress();
            const person1Address = await person1.getAddress();

            await expect(await con1.setTerms("Some terms!")).to.emit(shake, "NewTermsSet").withArgs("Some terms!");

            // registered users
            await expect(await con1.register("Keanu Willis")).to.emit(shake, "PersonRegistered").withArgs("Keanu Willis", ownerAddress);
            await expect(await con2.register("Buda Stanko")).to.emit(shake, "PersonRegistered").withArgs("Buda Stanko", person1Address);

            await expect(await con1.agree()).to.emit(shake, "PersonAgreed").withArgs("Keanu Willis", ownerAddress);
            await expect(await con2.agree()).to.emit(shake, "PersonAgreed").withArgs("Buda Stanko", person1Address);

            let members = await con1.getAllMembers();
            for (let i = 0; i < members.length; ++i) {
                expect(members[i].agreed).to.eq(true);
            }

            await expect(await con1.setTerms("Some terms!")).to.emit(shake, "NewTermsSet").withArgs("Some terms!");

            members = await con1.getAllMembers();
            for (let i = 0; i < members.length; ++i) {
                expect(members[i].agreed).to.eq(false);
            }
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
            const ownerAddress = await owner.getAddress();
            const person1Address = await person1.getAddress();

            await expect(await con1.setTerms("Some terms!")).to.emit(shake, "NewTermsSet").withArgs("Some terms!");

            // registered users
            await expect(await con1.register("Keanu Willis")).to.emit(shake, "PersonRegistered").withArgs("Keanu Willis", ownerAddress);
            await expect(await con2.register("Buda Stanko")).to.emit(shake, "PersonRegistered").withArgs("Buda Stanko", person1Address);

            await expect(await con1.agree()).to.emit(shake, "PersonAgreed").withArgs("Keanu Willis", ownerAddress);
            await expect(await con2.agree()).to.emit(shake, "PersonAgreed").withArgs("Buda Stanko", person1Address);
        });
    });
});