require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
      },
      {
        version: "0.6.6",
      },
      // {
      //   version: "0.6.12"
      // },
    ],
  },
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      gas: 12e6,
      blockGasLimit: 12e6,
      url: "http://localhost:8545",
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  gasReporter: {
    currency: "AUD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};
