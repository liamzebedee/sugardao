daobetic
========

[sugardao.eth](http://sugardao.vercel.app)

become a daobetic, get exposure to $SUGAR today.

* sugardao: the diabetic dao.
* $SUGAR: the sugar token, which fluctuates in price according to blood glucose levels.
* DIA: the diabetes-backed stablecoin

## Introduction
$SUGAR is a token which fluctuates in value according to my blood sugar levels. $SUGAR was distributed according to a [fair launch](https://insights.deribit.com/market-research/yfi-a-tale-of-fair-launch-governance-and-value/), where for 1 week anyone could become a sugar daddy/mummy.

$DIA is a stablecoin that can only be backed by $SUGAR. DIA allows anyone to bet on good sugar level control, and iDIA to bet on the inverse.

## Setup.

```
# Chain
npx hardhat node

# Deploy
npx hardhat run --network ovmTestnet scripts/migrations/1_deploy_loans.ts
npx hardhat run scripts/migrations/1_deploy_loans.ts

# Sugar feed bot.
ts-node sugarbot/index.ts node --provider-url http://localhost:8545 --nightscout-url https://EXAMPLE
```


#### Local OVM testnet proxy

Custom RPC URL: https://sugardao.vercel.app/api/ovm-testnet

```
ETH_RPC_URL=https://sugardao.vercel.app/api/ovm-testnet seth block latest
```