require('dotenv')
module.exports = {
    localhost: {
      gas: 12e6,
      blockGasLimit: 12e6,
      url: 'http://localhost:8545',
    },
    'ovmTestnet': {
      ovm: true,
      gas: 8e6,
      gasPrice: 0,
      chainId: 420,
      blockGasLimit: 9e6,
      url: 'https://sugardao.vercel.app/api/ovm-testnet',
      accounts: [process.env.OVM_TESTNET_PRIVATE_KEY]
    }
}