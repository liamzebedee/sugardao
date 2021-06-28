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
        await expect(SugarLoans.openLoan(amount)).to.be.revertedWith("");
      });
    });
  });
});
