const { expect } = require("chai");
const { ethers } = require("hardhat");

function mockObservations(n) {
  const coder = new ethers.utils.AbiCoder()
  let encodedData = []
  let data = []
  // timestamp begins -3h ago.
  let timestamp = Math.floor((Date.now() / 1000) - 60 * 60 * 3)
  // bgl begins at 7.0 mmol/L.
  let bgl = 70

  for (let i = 0; i < n; i++) {
    let datum = coder.encode(
      ["uint8", "uint64"],
      [ethers.BigNumber.from("" + bgl), ethers.BigNumber.from("" + timestamp)]
    );
    data.push([bgl, timestamp])
    encodedData.push(datum)
    // timestamp increases by 5mins + 0-2mins.
    timestamp += Math.round((5 * 60) + (2 * 60 * Math.random()))
    // bgl increases +/- 0-3 mmol/L.
    bgl += Math.round(3 * Math.random() * (Math.random() > 0.5 ? 1 : -1))
    bgl = Math.max(bgl % 255, 0)
  }

  return { data, encodedData }
}

describe("GlucoseFeed", async () => {
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

  describe('getHistory', async () => {
    it('returns the last n results', async () => {
      const data = mockObservations(3)
      await glucoseFeed.backfill(data);

      const history = await glucoseFeed.getHistory()
      expect(data).to.deep.equal(history);
    })
  })

  describe('backfill', async () => {
    context('When called with an array of results', async () => {
      it('imports it', async () => {
        const MAX_OBSERVATIONS = 36
        const { data, encodedData } = mockObservations(MAX_OBSERVATIONS + 10)

        await glucoseFeed.backfill(encodedData);

        const history = await glucoseFeed.getHistory()
        const expectedHistory = data.slice(-MAX_OBSERVATIONS)
        
        for (let i = 0; i < expectedHistory.length; i++) {
          expect(history[i].val).to.equal(expectedHistory[i][0])
        }
      })
    })
  })

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
