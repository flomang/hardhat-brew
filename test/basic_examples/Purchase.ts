import hardhat from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Purchase } from "../../typechain/Purchase";
import { Contract, Signer } from "ethers";
import contractJson from "../../artifacts/contracts/basic_examples/Purchase.sol/Purchase.json";


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
      await expect(await purchase.value()).to.eq(5);
    });
  });

  describe("confirm", async () => {
    it("should confirm purchase by the buyer", async () => {
      await expect(await purchase.connect(accounts[1]).confirmPurchase({value: 10})).to.emit(purchase, "PurchaseConfirmed").withArgs(accounts[1].getAddress, 5);
      await expect(await purchase.state()).to.eq(1);
    });

    it("should confirm recieve by the buyer and refund seller", async () => {
      await expect(await purchase.connect(accounts[1]).confirmPurchase({value: 10}));
      await expect(await purchase.connect(accounts[1]).confirmReceived())
        .to.emit(purchase, "ItemReceived").withArgs(accounts[1].getAddress, 5)
        .to.changeEtherBalance(accounts[1], 5);

      await expect(await purchase.state()).to.eq(2);

      await expect(await purchase.connect(accounts[0]).refundSeller())
        .to.emit(purchase, "SellerRefunded")
        .to.changeEtherBalance(accounts[0], 15);

      await expect(await purchase.state()).to.eq(3);
    });

    it("should revert refundSeller when wrong seller", async () => {
        await expect(await purchase.connect(accounts[1]).confirmPurchase({value: 10}));
        await expect(await purchase.connect(accounts[1]).confirmReceived())
          .to.emit(purchase, "ItemReceived").withArgs(accounts[1].getAddress, 5)
          .to.changeEtherBalance(accounts[1], 5);
  
        await expect(await purchase.state()).to.eq(2);
        await expect(purchase.connect(accounts[1]).refundSeller()).to.be.revertedWith("Only seller can call this.");
        await expect(await purchase.state()).to.eq(2);

        await expect(purchase.connect(accounts[0]).abort()).to.be.revertedWith("Invalid state.");
    });

    it("should revert confirmReceived when wrong buyer", async () => {
        await expect(await purchase.connect(accounts[1]).confirmPurchase({value: 10}));
        await expect(purchase.connect(accounts[0]).confirmReceived()).to.be.revertedWith("Only buyer can call this.");
        await expect(await purchase.state()).to.eq(1);
    });

    it("should revert confirmReceived when no buyer", async () => {
        await expect(purchase.connect(accounts[1]).confirmReceived()).to.be.revertedWith("Only buyer can call this.");
        await expect(await purchase.state()).to.eq(0);
    });

    it("should revert abort when in wrong state", async () => {
        await expect(await purchase.connect(accounts[1]).confirmPurchase({value: 10}));
        await expect(purchase.connect(accounts[0]).abort()).to.be.revertedWith("Invalid state.");
        await expect(await purchase.state()).to.eq(1);
    });
  });
});