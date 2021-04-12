import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { OpenBet } from "../../typechain/OpenBet";
import { Signer } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("OpenBet", () => {
    let bet: OpenBet;
    let owner: Signer;
    let player1: Signer;
    let player2: Signer;
    let addrs;

    beforeEach(async () => {
        [owner, player1, player2, ...addrs] = await ethers.getSigners();
        const tokenFactory = await ethers.getContractFactory(
            "OpenBet",
            owner,
        );

        bet = (await tokenFactory.deploy()) as OpenBet;
    });

    describe("Deployment", async () => {
        it("Should set min bet", async () => {
            expect(await bet.minimumBet()).to.equal(3);
        });

        it("Should have no players", async () => {
            let playerAddress = await player1.getAddress()

            expect(await bet.checkPlayerExists(playerAddress)).to.equal(false);
        });
    });

    describe("Betting", async () => {
        it("player one places a bet", async () => {
            let playerCon = bet.connect(player1);
            let playerAddress = await player1.getAddress()

            // player1 bets 3 ethers
            expect(await playerCon.bet(1, { value: 3 })).to.emit(bet, "BetConfirmed");

            // player should now exist
            expect(await bet.checkPlayerExists(playerAddress)).to.eq(true);

            // player cannot bet again
            expect(playerCon.bet(1, { value: 7 })).to.revertedWith("revert you have already placed your wager!")
        });

        it("player one and two place opposing bets", async () => {
            let player1Con = bet.connect(player1);
            let player2Con = bet.connect(player2);
            let player1Address = await player1.getAddress()

            // player1 bets 3 ethers
            expect(await player1Con.bet(1, { value: 3 })).to.emit(bet, "BetConfirmed");
            expect(await player2Con.bet(2, { value: 7 })).to.emit(bet, "BetConfirmed");

            expect(await bet.AmountOne()).to.eq(3);
            expect(await bet.AmountTwo()).to.eq(7);

            expect(await bet.distributePrizes(1)).to.emit(bet, "PrizeDistributed").withArgs(1, 1, 7)

            //console.log(await player1.getBalance());
            //console.log(await player2.getBalance());
        });
    });
});