import hardhat from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Purchase } from "../typechain/Purchase";
import { Contract, Signer } from "ethers";
import contractJson from "../artifacts/contracts/Purchase.sol/Purchase.json";


chai.use(solidity);
const { expect } = chai;
const { waffle } = hardhat;

describe("Purchase", () => {
  let accounts: Signer[];
  let purchase: Contract;

  beforeEach(async () => {
    accounts = waffle.provider.getWallets();
    purchase = await waffle.deployContract(accounts[0], contractJson, [], {value: 10});
  });

  describe("deployment", async () => {
    it("should set contract value to 5", async () => {
      expect(await purchase.value()).to.eq(5);
    });
  });

  describe("confirm", async () => {
    it("should confirm purchase by the buyer", async () => {
      expect(await purchase.connect(accounts[1]).confirmPurchase({value: 10})).to.emit(purchase, "PurchaseConfirmed").withArgs(accounts[1].getAddress, 5);
      expect(await purchase.state()).to.eq(1);
    });

    it("should confirm recieve by the buyer", async () => {
      expect(await purchase.connect(accounts[1]).confirmPurchase({value: 10}));
      expect(await purchase.connect(accounts[1]).confirmReceived())
        .to.emit(purchase, "ItemReceived").withArgs(accounts[1].getAddress, 5)
        .to.changeEtherBalance(accounts[1], 5);

      expect(await purchase.state()).to.eq(2);

      expect(await purchase.connect(accounts[0]).refundSeller())
        .to.emit(purchase, "SellerRefunded")
        .to.changeEtherBalance(accounts[0], 15);

      expect(await purchase.state()).to.eq(3);
    });

    it("should revert if wrong seller", async () => {
        expect(await purchase.connect(accounts[1]).confirmPurchase({value: 10}));
        expect(await purchase.connect(accounts[1]).confirmReceived())
          .to.emit(purchase, "ItemReceived").withArgs(accounts[1].getAddress, 5)
          .to.changeEtherBalance(accounts[1], 5);
  
        expect(await purchase.state()).to.eq(2);
        await expect(purchase.connect(accounts[1]).refundSeller()).to.be.revertedWith("Only seller can call this.");
        expect(await purchase.state()).to.eq(2);
      });
  });
});