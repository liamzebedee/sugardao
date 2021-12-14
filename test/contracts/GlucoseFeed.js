const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.only("GlucoseFeed", async () => {
  let glucoseFeed;
  let accounts;
  let owner;
  let nonOwner;

  before(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    nonOwner = accounts[1];

    const resolverFactory = await ethers.getContractFactory("AddressResolver");
    resolver = await resolverFactory.deploy(await owner.getAddress());

    const glucoseFeedFactory = await ethers.getContractFactory("GlucoseFeed");
    glucoseFeed = await glucoseFeedFactory.deploy(
      await owner.getAddress(),
      resolver.address
    );
  });

  describe("post", async () => {
    context("When called by a non-owner", async () => {
      it("Reverts", async () => {
        const value = ethers.constants.One;
        const timestamp = ethers.BigNumber.from("1625222946");

        expect(glucoseFeed.connect(nonOwner).post(value, timestamp)).to.be.revertedWith("");
      });
    });

    context("When called by an owner and with old timestamp", async () => {
        it("Does not update BGL", async () => {
            const firstValue = ethers.BigNumber.from("70");
            const secondValue = ethers.BigNumber.from("50");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.sub(ethers.constants.One);

            await glucoseFeed.post(firstValue, firstTimestamp);
            await glucoseFeed.post(secondValue, secondTimestamp);

            const expectedBGL = firstValue;

            let { value } = await glucoseFeed.latest()
            expect(value).to.equal(expectedBGL);
        });

        it("Does not update last updated time", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.sub(ethers.constants.One);

            await glucoseFeed.post(firstValue, firstTimestamp);
            await glucoseFeed.post(secondValue, secondTimestamp);

            const expectedLastUpdatedTime = firstTimestamp;
            
            let { lastUpdatedTime } = await glucoseFeed.latest()
            expect(lastUpdatedTime).to.equal(expectedLastUpdatedTime);
        });

        it("Emits an Update event", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.sub(ethers.constants.One);

            await glucoseFeed.post(firstValue, firstTimestamp);

            await expect(glucoseFeed.post(secondValue, secondTimestamp))
                    .to
                    .emit(glucoseFeed, "Update")
                    .withArgs(secondValue, secondTimestamp);
        });
    });
    
    context("When called by an owner and with a new timestamp", async () => {
        it("Updates BGL", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.add(ethers.constants.One);

            await glucoseFeed.post(firstValue, firstTimestamp);
            await glucoseFeed.post(secondValue, secondTimestamp);

            const expectedBGL = secondValue;

            let { value } = await glucoseFeed.latest()
            expect(value).to.equal(expectedBGL);
        });

        it("Updates last updated time", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.add(ethers.constants.One);

            await glucoseFeed.post(firstValue, firstTimestamp);
            await glucoseFeed.post(secondValue, secondTimestamp);

            const expectedLastUpdatedTime = secondTimestamp;

            let { lastUpdatedTime } = await glucoseFeed.latest()
            expect(lastUpdatedTime).to.equal(expectedLastUpdatedTime);
        });

        it("Emits an Update event", async () => {
            const firstValue = ethers.BigNumber.from("7");
            const secondValue = ethers.BigNumber.from("5");
            
            const firstTimestamp = ethers.BigNumber.from("1625222946");
            const secondTimestamp = firstTimestamp.add(ethers.constants.One);

            await glucoseFeed.post(firstValue, firstTimestamp);

            await expect(glucoseFeed.post(secondValue, secondTimestamp))
                    .to
                    .emit(glucoseFeed, "Update")
                    .withArgs(secondValue, secondTimestamp);
        });
    });
  });
});
