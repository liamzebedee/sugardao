const { expect } = require("chai");
const { ethers } = require("hardhat");



function mockObservations(n) {
    const coder = new ethers.utils.AbiCoder()
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
        data.push(datum)
        // timestamp increases by 5mins + 0-2mins.
        timestamp += Math.round((5 * 60) + (2 * 60 * Math.random()))
        // bgl increases +/- 0-3 mmol/L.
        bgl += Math.round(3 * Math.random() * (Math.random() > 0.5 ? 1 : -1))
        bgl = Math.max(bgl % 255, 0)
    }

    return data
}

describe.only("Daobetic", async () => {
    let glucoseFeed;
    let daobetic;
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

        const daobeticFactory = await ethers.getContractFactory("Daobetic")
        daobetic = await daobeticFactory.deploy(
            await owner.getAddress(),
            resolver.address
        );

        await daobetic.setFeed(glucoseFeed.address)
    });

    describe('svg', async () => {
        context('when calling tokenURI', async () => {
            it('imports it', async () => {
                const MAX_OBSERVATIONS = 36;
                const data = mockObservations(MAX_OBSERVATIONS + 10)
                await glucoseFeed.backfill(data);

                const tokenURI = await daobetic.tokenURI(ethers.BigNumber.from("420"))
                const metadata = JSON.parse(atob(tokenURI.split('data:application/json;base64,')[1]))
                const svg = atob(metadata.image.split('data:image/svg+xml;base64,')[1])
                console.log(svg)
            })
        })
    });
});
