import hardhat from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Purchase } from "../typechain/Purchase";
import { Contract, Signer } from "ethers";
import contractJson from "../artifacts/contracts/Purchase.sol/Purchase.json";


chai.use(solidity);
const { expect } = chai;
const { ethers, waffle } = hardhat;
const provider = waffle.provider;

describe("Purchase", () => {
  let accounts: Signer[];
  let purchase: Contract;

  beforeEach(async () => {
    // 1
    //accounts = await ethers.getSigners();
    accounts = provider.getWallets();
    purchase = await waffle.deployContract(accounts[0], contractJson, [], {value: 10})
  });

  describe("deployment", async () => {
    it("should set contract value to 5", async () => {
      //await counter.countUp();
      //let count = await counter.getCount();
      expect(await purchase.value()).to.eq(5);
    });
  });

  describe("confirm", async () => {
    it("should check value condition", async () => {
      //await counter.countUp();
      //let count = await counter.getCount();
      expect(await purchase.confirmPurchase({value: 10})).to.emit(purchase, "PurchaseConfirmed")
    });
  });
});