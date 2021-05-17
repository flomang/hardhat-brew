import { upgrades, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Signer } from "ethers";
import { SimpleWager } from "../../typechain/SimpleWager";
import { Address } from "node:cluster";

chai.use(solidity);
const { expect } = chai;

describe("SimpleWager", () => {
    let owner: Signer;
    let user1: Signer;
    let user2: Signer;
    let user3: Signer;
    let guice: SimpleWager;
    let ownercon: SimpleWager;
    let user1con: SimpleWager;
    let user2con: SimpleWager;
    let user3con: SimpleWager;

    beforeEach(async () => {
        [owner, user1, user2, user3] = await ethers.getSigners();
        const juice = await ethers.getContractFactory("SimpleWager");
        guice = await upgrades.deployProxy(juice, [], { initializer: 'initialize' }) as SimpleWager;
        await guice.deployed();

        ownercon = guice.connect(owner);
        user1con = guice.connect(user1);
        user2con = guice.connect(user2);
        user3con = guice.connect(user3);
    });

    describe("deployment", async () => {
        it("should set the owner", async () => {
            const ownerAddress: string = await owner.getAddress();
            expect(await guice.owner()).to.eq(ownerAddress);
        });
    });

    describe("wagers", async () => {
        it("should be able to be created", async () => {
            const userAddress: string = await user1.getAddress();
            const desc = "I am filthy rich!";
            const amount = 10;

            expect(await user1con.createWager(desc, { value: amount })).to.emit(guice, "WagerCreated");
            const wagerID = await user1con.wagersCreated();
            expect(wagerID).to.eq(1);

            const wager = await user1con.wagers(wagerID);
            expect(wager.wagerID).to.eq(wagerID);
            expect(wager.description).to.eq(desc);
            expect(wager.status).to.eq(1);
            expect(wager.maker.player).to.eq(userAddress);
            expect(wager.maker.amount).to.eq(amount);
        });

        it("can be cancelled", async () => {
            expect(await user1con.createWager("Cancel test", { value: 10 })).to.emit(guice, "WagerCreated");
            const wagerID = await user1con.wagersCreated();

            expect(await user1con.cancelWager(wagerID)).to.emit(guice, "WagerCancelled");

            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(0);
        });

        it("can be accepted", async () => {
            expect(await user1con.createWager("Make it happen!", { value: 7 })).to.emit(guice, "WagerCreated");
            const wagerID = await user1con.wagersCreated();

            expect(await user2con.acceptWager(wagerID, { value: 7 })).to.emit(guice, "WagerAccepted");

            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(2);
        });

        it("can't be accepted when cancelled", async () => {
            expect(await user1con.createWager("Cancel test", { value: 7 }))
                .to.emit(guice, "WagerCreated")
                .to.changeEtherBalance(user1, -7);

            const wagerID = await user1con.wagersCreated();

            expect(await user1con.cancelWager(wagerID))
                .to.emit(guice, "WagerCancelled")
                .to.changeEtherBalance(user1, 7);

            expect(user2con.acceptWager(wagerID, { value: 7 }))
                .to.revertedWith("the wager is no longer available");
        });

        it("can't be cancelled by takers", async () => {
            await user1con.createWager("Yo quiero!", { value: 10 });
            expect(user2con.cancelWager(1)).to.revertedWith("no bueno");
        });

        it("can't be accepted when in play", async () => {
            const wagerID = 1;
            await user1con.createWager("In play test", { value: 7 });
            await user2con.acceptWager(wagerID, { value: 7 });
            expect(user3con.acceptWager(wagerID, { value: 7 })).to.revertedWith("the wager is no longer available");
        });

        it("forfeit when results disagree", async () => {
            const wagerID = 1;
            await user1con.createWager("Forfeit test", { value: 7 });
            await user2con.acceptWager(wagerID, { value: 7 });

            expect(await user1con.submitResult(wagerID, true))
                .to.emit(guice, "WagerClaimSubmitted");

            expect(await user2con.submitResult(wagerID, false))
                .to.emit(guice, "WagerClaimSubmitted")
                .to.emit(guice, "WagerForfeited");

            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(4);
        });

        it("can be settled", async () => {
            await user1con.createWager("Flo is awesome", { value: 100 });
            const wagerID = await user1con.wagersCreated();

            await user2con.acceptWager(wagerID, { value: 100 });

            expect(await user1con.submitResult(wagerID, true))
                .to.emit(guice, "WagerClaimSubmitted");

            expect(await user2con.submitResult(wagerID, true))
                .to.emit(guice, "WagerSettled")
                .to.changeEtherBalance(user1, 200);

            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(3);
        });

        it("can be terminated", async () => {
            await expect(await user1con.createWager("Terminator", { value: 10 }));
            const wagerID = await user1con.wagersCreated();

            await expect(await user2con.acceptWager(wagerID, { value: 10 }));
            await expect(await ownercon.terminate(wagerID))
                .to.emit(guice, "WagerTerminated")
                .to.changeEtherBalances([user1, user2], [10, 10]);

            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(6);
        });

        it("cannot be terminated by non owner", async () => {
            await user1con.createWager("Terminator", { value: 10 });
            const wagerID = await user1con.wagersCreated();

            expect(await user2con.acceptWager(wagerID, { value: 10 })).to.emit(guice, "WagerAccepted");
            expect(user1con.terminate(wagerID)).to.revertedWith("Ownable: caller is not the owner");
        });

        it("can be aborted", async () => {
            await user1con.createWager("Abort test", { value: 10 });
            const wagerID = await user1con.wagersCreated();

            await user2con.acceptWager(wagerID, { value: 10 });

            expect(await user2con.abort(wagerID))
                .to.emit(guice, "WagerAborted")
                .to.changeEtherBalances([user1,user2],  [10, 10]);

            const wager = await user1con.wagers(wagerID);
            expect(wager.status).to.eq(5);
        });

        it("cannot be aborted by other players", async () => {
            await user1con.createWager("Abort test", { value: 7 });
            const wagerID = await user1con.wagersCreated();

            await user2con.acceptWager(wagerID, { value: 7 });

            expect(user3con.abort(wagerID)).to.revertedWith("no bueno");
        });
    });
});