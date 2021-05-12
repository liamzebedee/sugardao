set -ex
export BG_URL=https://zediabetes.herokuapp.com/
export ETH_RPC_URL=http://localhost:8545
export PRIVATE_KEY=0x

ts-node sugarbot/index.ts node --provider-url $ETH_RPC_URL --nightscout-url $BG_URL