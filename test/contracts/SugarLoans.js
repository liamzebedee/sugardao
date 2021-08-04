const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils: { parseEther, formatBytes32String } } = ethers

async function testToken() {
  const token = await ethers.getContractFactory("TestToken");
  return await token.deploy()
}

async function deployContracts() {

}

describe("SugarLoans", async () => {
  let SugarLoans;
  let SugarOracle;
  let DIAToken;
  let iDIAToken;
  let accounts;
  let owner;
  let nonOwner;

  before(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    nonOwner = accounts[1];

    const resolverFactory = await ethers.getContractFactory("AddressResolver");
    resolver = await resolverFactory.deploy(await owner.getAddress());

    const sugarLoansFactory = await ethers.getContractFactory("SugarLoans");
    SugarLoans = await sugarLoansFactory.deploy(
      await owner.getAddress(),
      resolver.address
    );

    SugarToken = await testToken()
    DIAToken = await testToken()
    iDIAToken = await testToken()

    SugarOracle = await (await ethers.getContractFactory("TestSugarOracle")).deploy()

    async function inject({ resolver, deps, contracts }) {
      await resolver.importAddresses(
        Object.keys(deps).map(formatBytes32String),
        Object.values(deps)
      )
      for(const contract of contracts) {
        await contract.rebuildCache()
      }
    }
    
    await inject({
      resolver,
      deps: {
        SUGAR: SugarToken.address,
        DIA: DIAToken.address,
        iDIA: iDIAToken.address,
        SugarOracle: SugarOracle.address
      }, 
      contracts: [SugarLoans]
    })
  });

  describe("open", async () => {
    describe('when called with enough SUGAR collateral', async () => {
      before(async () => {
        await SugarToken.mint(owner.address, parseEther('1000'))
        await SugarToken.approve(SugarLoans.address, parseEther('1000'))

        await SugarOracle.setPrice(parseEther('1.0'))
      })
      
      it('mints DIA to user', async () => {
        const mintAmount = parseEther('50')
        await SugarLoans.open('1', mintAmount)

        expect(await DIAToken.balanceOf(owner.address)).to.equal(mintAmount);
      })
    })

    context("When called", async () => {
      it("Reverts", async () => {
        const amount = ethers.constants.One;
        expect(SugarLoans.open(amount)).to.be.revertedWith("");
      });

    });
  });
});
