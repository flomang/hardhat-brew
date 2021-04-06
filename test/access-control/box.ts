import hardhat, { upgrades, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer } from "ethers";
import contractJson from "../../artifacts/contracts/access-control/Box.sol/Box.json";


chai.use(solidity);
const { expect } = chai;
const { waffle } = hardhat;

describe("Box", () => {
    let owner: Signer;
    let imposter: Signer;
    let boxContract: Contract;

    beforeEach(async () => {
        let accounts = waffle.provider.getWallets();
        owner = accounts[0];
        imposter = accounts[1];

        boxContract = await waffle.deployContract(owner, contractJson);
        await boxContract.deployed();
    });

   // describe("upgrade", async () => {
   //     it("should set the owner", async () => {
   //     const Box = await ethers.getContractFactory("Box");
   //     const BoxV2 = await ethers.getContractFactory("BoxV2");

   //     const instance = await upgrades.deployProxy(Box, [42]);
   //     boxContract = await upgrades.upgradeProxy(instance.address, BoxV2);
   //         let ownerAddress: string = await owner.getAddress();
   //         // employer should be able to send more ether to the contract
   //         await expect(await boxContract.owner()).to.eq(ownerAddress);
   //     });
   // });

    describe("deployment", async () => {
        it("should set the owner", async () => {
            let ownerAddress: string = await owner.getAddress();
            // employer should be able to send more ether to the contract
            await expect(await boxContract.owner()).to.eq(ownerAddress);
        });
    });

    describe("owner access", async () => {
        it("should allow the owner to store values", async () => {
            //let ownerAddress: string = await owner.getAddress();
            // employer should be able to send more ether to the contract
            await expect(await boxContract.store(123)).to.emit(boxContract, "ValueChanged").withArgs(123);

            await expect(await boxContract.retrieve()).to.eq(123);
        });

        it("should reject imposters", async () => {
            let con = boxContract.connect(imposter);
            //let ownerAddress: string = await owner.getAddress();
            // employer should be able to send more ether to the contract
            await expect(con.store(123)).to.revertedWith("Ownable: caller is not the owner");
        });
    });
});