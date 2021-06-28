const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Unit tests: Trader.sol", async () => {
  let SugarLoans;
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
  });

  describe("openLoan", async () => {
    context("When called", async () => {
      it("Reverts", async () => {
        const amount = ethers.constants.One;
        expect(SugarLoans.openLoan(amount)).to.be.revertedWith("");
      });
    });
  });

  describe("score", async () => {
    context("When called with BGL above target", async () => {
      it("Returns the correct score", async () => {
        const one = ethers.constants.One.mul(ethers.constants.WeiPerEther);
        const eleven = ethers.BigNumber.from("11").mul(
          ethers.constants.WeiPerEther
        );
        const seven = ethers.BigNumber.from("7").mul(
          ethers.constants.WeiPerEther
        );
        const eighteen = ethers.BigNumber.from("18").mul(
          ethers.constants.WeiPerEther
        );
        const targetBGL = seven;
        const upperBGLBound = eighteen;

        const actualBGL = ethers.BigNumber.from("8").mul(
          ethers.constants.WeiPerEther
        );

        const fValue = actualBGL.sub(targetBGL).div(upperBGLBound);

        const expectedScore = one.sub(fValue);

        expect(await SugarLoans.score(actualBGL)).to.be.equal(expectedScore);
      });
    });
  });
});
