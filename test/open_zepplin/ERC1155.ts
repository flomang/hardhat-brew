import { upgrades, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("ERC1155", () => {
    let owner: Signer;
    let player: Signer;
    let game: Contract;

    beforeEach(async () => {
        [owner, player] = await ethers.getSigners();
        const ownerAddress = await owner.getAddress();

        const ERC1155 = await ethers.getContractFactory("ERC1155");
        //console.log("Deploying AdminBox...");
        game = await upgrades.deployProxy(ERC1155, [], { initializer: 'initialize' });

        await game.deployed();
        //console.log("AdminBox deployed to:", box.address);
    });

    describe("deployment", async () => {
        it("should set the owner balance", async () => {
            let ownerAddress: string = await owner.getAddress();
            await expect(await game.balanceOf(ownerAddress, 3)).to.eq(1000000000);
        });
    });

    describe("functions", async () => {
        it("should transfer", async () => {
            let ownerAddress: string = await owner.getAddress();
            let playerAddress: string = await player.getAddress();

            await expect (await game.safeTransferFrom(ownerAddress, playerAddress, 2, 1, "0x01")).to.emit(game, "TransferSingle");
            await expect(await game.balanceOf(playerAddress, 2)).to.eq(1);
        });
    });
});