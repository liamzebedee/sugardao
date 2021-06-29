set -ex
export BG_URL=https://zediabetes.herokuapp.com/
# export ETH_RPC_URL=http://localhost:8545
export ETH_RPC_URL=https://sugardao.vercel.app/api/ovm-testnet
# export PRIVATE_KEY=0x
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

export NETWORK=ovmTestnet

ts-node sugarbot/index.ts node --provider-url $ETH_RPC_URL --nightscout-url $BG_URL