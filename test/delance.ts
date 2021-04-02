import hardhat from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer } from "ethers";
import contractJson from "../artifacts/contracts/Delance.sol/Delance.json";


chai.use(solidity);
const { expect } = chai;
const { waffle } = hardhat;

describe("Delance", () => {
    let employer: Signer;
    let freelancer: Signer;
    let delance: Contract;

    beforeEach(async () => {
        let accounts = waffle.provider.getWallets();
        employer = accounts[0];
        freelancer = accounts[1];

        delance = await waffle.deployContract(employer, contractJson, [freelancer.getAddress(), 1617302513], {value: 3});
    });

    describe("deployment", async () => {
        it("should set recieve more ether", async () => {
            // employer should be able to send more ether to the contract
            await expect(await employer.sendTransaction({to: delance.address, value: 7})).to.changeEtherBalance(employer, -7);

            // the contract price should now be 10
            await expect(await delance.connect(employer).price()).to.eq(10);
        });

        it("should set contract price to 3 after deployment", async () => {
            await expect(await delance.price()).to.eq(3);
        });
    });

    describe("freelance payrequest", async () => {
        it("should emit RequestCreated", async () => {
            // the contract price should now be 10
            await expect(await delance.connect(freelancer).createRequest("Robotics delivery", 300))
              .to.emit(delance, "RequestCreated")
              .withArgs("Robotics delivery", 300, true, false);
        });

        it("should revert on locked pay requests", async () => {
            let elfreelancer = delance.connect(freelancer);

            // the contract price should now be 10
            await expect(await elfreelancer.createRequest("Robotics delivery", 300))
              .to.emit(delance, "RequestCreated")
            
            await expect(elfreelancer.payRequest(0)).to.revertedWith("Request is locked");
        });

        it("should succeed after employer unlocks the request", async () => {
            let elfreelancer = delance.connect(freelancer);
            let elemployer = delance.connect(employer);

            // the contract price should now be 10
            await expect(await elfreelancer.createRequest("Robotics delivery", 3)).to.emit(delance, "RequestCreated")

            // employer unlocks the request
            await expect(await elemployer.unlockRequest(0)).to.emit(delance, "RequestUnlocked").withArgs(false);

            // freelancer should be able to get paid now
            await expect(await elfreelancer.payRequest(0))
              .to.emit(delance, "RequestPaid").withArgs(freelancer.getAddress, 3)
              .to.changeEtherBalances([delance, freelancer], [-3, 3]);
        });
    });
});