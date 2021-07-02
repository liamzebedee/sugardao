const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SugarFeed", async () => {
  let SugarFeed;
  let accounts;
  let owner;
  let nonOwner;

  before(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    nonOwner = accounts[1];

    const resolverFactory = await ethers.getContractFactory("AddressResolver");
    resolver = await resolverFactory.deploy(await owner.getAddress());

    const sugarFeedFactory = await ethers.getContractFactory("SugarFeed");
    SugarFeed = await sugarFeedFactory.deploy(
      await owner.getAddress(),
      resolver.address
    );
  });

  describe("post", async () => {
    context("When called by a non-owner", async () => {
      it("Reverts", async () => {
        const value = ethers.constants.One;
        const timestamp = ethers.BigNumber.from("1625222946");

        expect(SugarFeed.connect(nonOwner).post(value, timestamp)).to.be.revertedWith("");
      });
    });

    context("When called by an owner and with old timestamp", async () => {
        it("Does not update BGL", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.sub(ethers.constants.One);

            await SugarFeed.post(firstValue, firstTimestamp);
            await SugarFeed.post(secondValue, secondTimestamp);

            const expectedBGL = firstValue;

            expect(await SugarFeed.bgl()).to.equal(expectedBGL);
        });

        it("Does not update last updated time", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.sub(ethers.constants.One);

            await SugarFeed.post(firstValue, firstTimestamp);
            await SugarFeed.post(secondValue, secondTimestamp);

            const expectedLastUpdatedTime = firstTimestamp;

            expect(await SugarFeed.lastUpdatedTime()).to.equal(expectedLastUpdatedTime);
        });

        it("Emits an Update event", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.sub(ethers.constants.One);

            await SugarFeed.post(firstValue, firstTimestamp);

            await expect(SugarFeed.post(secondValue, secondTimestamp))
                    .to
                    .emit(SugarFeed, "Update")
                    .withArgs(secondValue, secondTimestamp);
        });
    });
    
    context("When called by an owner and with a new timestamp", async () => {
        it("Updates BGL", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.add(ethers.constants.One);

            await SugarFeed.post(firstValue, firstTimestamp);
            await SugarFeed.post(secondValue, secondTimestamp);

            const expectedBGL = secondValue;

            expect(await SugarFeed.bgl()).to.equal(expectedBGL);
        });

        it("Updates last updated time", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.add(ethers.constants.One);

            await SugarFeed.post(firstValue, firstTimestamp);
            await SugarFeed.post(secondValue, secondTimestamp);

            const expectedLastUpdatedTime = secondTimestamp;

            expect(await SugarFeed.lastUpdatedTime()).to.equal(expectedLastUpdatedTime);
        });

        it("Emits an Update event", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.add(ethers.constants.One);

            await SugarFeed.post(firstValue, firstTimestamp);

            await expect(SugarFeed.post(secondValue, secondTimestamp))
                    .to
                    .emit(SugarFeed, "Update")
                    .withArgs(secondValue, secondTimestamp);
        });
    });
  });
});
