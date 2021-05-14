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
    let user3: Signer;
    let guice: Guice;

    beforeEach(async () => {
        [owner, user1, user2, user3] = await ethers.getSigners();
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
            let desc = "I am filthy rich!";
            let amount = 10;
            let wagerID = 1;

            await expect(await user1con.createWager(desc, { value: amount })).to.emit(guice, "WagerCreated").withArgs(wagerID, userAddress, desc, amount);

            let wager = await user1con.wagers(wagerID);
            expect(wager.wagerID).to.eq(wagerID);
            expect(wager.description).to.eq(desc);
            expect(wager.status).to.eq(1);
            expect(wager.maker.player).to.eq(userAddress);
            expect(wager.maker.amount).to.eq(amount);
        });

        it("can be cancelled", async () => {
            let userAddress: string = await user1.getAddress();
            let user1con = guice.connect(user1);
            let desc = "Cancelled this wager!";
            let amount = 10;
            let wagerID = 1;

            await expect(await user1con.createWager(desc, { value: amount })).to.emit(guice, "WagerCreated").withArgs(wagerID, userAddress, desc, amount);
            await expect(await user1con.cancelWager(wagerID)).to.emit(guice, "WagerCancelled").withArgs(wagerID);
            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(0);
        });

        it("can be accepted", async () => {
            let user1Address: string = await user1.getAddress();
            let user2Address: string = await user2.getAddress();
            let user1con = guice.connect(user1);
            let user2con = guice.connect(user2);
            let desc = "Pooperbowl wins!";
            let amount1 = 10;
            let amount2 = 7;
            let wagerID = 1;

            await expect(await user1con.createWager(desc, { value: amount1 })).to.emit(guice, "WagerCreated").withArgs(wagerID, user1Address, desc, amount1);
            await expect(await user2con.acceptWager(wagerID, { value: amount2 })).to.emit(guice, "WagerAccepted").withArgs(wagerID, user2Address, desc, amount2);

            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(2);
        });

        it("can't be accepted when cancelled", async () => {
            let user1Address: string = await user1.getAddress();
            let user1con = guice.connect(user1);
            let user2con = guice.connect(user2);
            let desc = "Mistako!";
            let amount1 = 10;
            let amount2 = 7;
            let wagerID = 1;

            await expect(await user1con.createWager(desc, { value: amount1 })).to.emit(guice, "WagerCreated").withArgs(wagerID, user1Address, desc, amount1).to.changeEtherBalance(user1, -10);;
            await expect(await user1con.cancelWager(wagerID)).to.emit(guice, "WagerCancelled").withArgs(wagerID).to.changeEtherBalance(user1, 10);
            await expect(user2con.acceptWager(wagerID, { value: amount2 })).to.revertedWith("the wager is no longer available");
        });

        it("can't be cancelled by takers", async () => {
            let user1con = guice.connect(user1);
            let user2con = guice.connect(user2);
            let desc = "Yo soy suave!";
            let wagerID = 1;

            await user1con.createWager(desc, { value: 10 });
            await expect(user2con.cancelWager(wagerID)).to.revertedWith("no bueno");
        });

        it("can't be accepted when in play", async () => {
            let user1Address: string = await user1.getAddress();
            let user2Address: string = await user2.getAddress();
            let user1con = guice.connect(user1);
            let user2con = guice.connect(user2);
            let user3con = guice.connect(user3);
            let desc = "Pooperbowl wins!";
            let amount1 = 10;
            let amount2 = 7;
            let wagerID = 1;

            await expect(await user1con.createWager(desc, { value: amount1 })).to.emit(guice, "WagerCreated").withArgs(wagerID, user1Address, desc, amount1);
            await expect(await user2con.acceptWager(wagerID, { value: amount2 })).to.emit(guice, "WagerAccepted").withArgs(wagerID, user2Address, desc, amount2);
            await expect(user3con.acceptWager(wagerID, { value: amount2 })).to.revertedWith("the wager is no longer available");
        });

        it("forfeit when results disagree", async () => {
            let user1Address: string = await user1.getAddress();
            let user2Address: string = await user2.getAddress();
            let user1con = guice.connect(user1);
            let user2con = guice.connect(user2);
            let desc = "Pooperbowl wins!";
            let amount1 = 10;
            let amount2 = 3;
            let wagerID = 1;

            await expect(await user1con.createWager(desc, { value: amount1 })).to.emit(guice, "WagerCreated").withArgs(wagerID, user1Address, desc, amount1);
            await expect(await user2con.acceptWager(wagerID, { value: amount2 })).to.emit(guice, "WagerAccepted").withArgs(wagerID, user2Address, desc, amount2);

            await expect(await user1con.submitResult(wagerID, true)).to.emit(guice, "WagerClaimSubmitted").withArgs(wagerID, user1Address, true);
            await expect(await user2con.submitResult(wagerID, false))
                .to.emit(guice, "WagerClaimSubmitted").withArgs(wagerID, user2Address, false)
                .to.emit(guice, "WagerForfeited").withArgs(wagerID, amount2*2, true, false).to.changeEtherBalance(user1, 7);

            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(4);
        });

        it("can be refunded", async () => {
            let user1Address: string = await user1.getAddress();
            let user2Address: string = await user2.getAddress();
            let user1con = guice.connect(user1);
            let user2con = guice.connect(user2);
            let desc = "Refund nosotros!";
            let amount1 = 10;
            let amount2 = 3;
            let wagerID = 1;

            await expect(await user1con.createWager(desc, { value: amount1 })).to.emit(guice, "WagerCreated").withArgs(wagerID, user1Address, desc, amount1);
            await expect(await user2con.acceptWager(wagerID, { value: amount2 })).to.emit(guice, "WagerAccepted").withArgs(wagerID, user2Address, desc, amount2);

            await expect(await user2con.refund(wagerID))
                .to.emit(guice, "WagerRefunded").withArgs(wagerID)
                .to.changeEtherBalances([user1,user2],  [10, 3]);

            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(5);
        });

        it("cannot be refunded by other players", async () => {
            let user1con = guice.connect(user1);
            let user2con = guice.connect(user2);
            let user3con = guice.connect(user3);
            let desc = "Refund scammer!";
            let wagerID = 1;

            await user1con.createWager(desc, { value: 10 });
            await user2con.acceptWager(wagerID, { value: 4 });
            await expect(user3con.refund(wagerID)).to.revertedWith("no bueno");
        });
    });
});