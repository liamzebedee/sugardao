sugardao
========

[sugardao.eth](http://sugardao.vercel.app)

become a daobetic, get exposure to $SUGAR today.

* sugardao: the diabetic dao.
* $SUGAR: the sugar token, which fluctuates in price according to blood glucose levels.
* DIA: the diabetes-backed stablecoin (and its inverse, iDIA, if you want to bet against diabetes)

## Introduction
$SUGAR is a token which fluctuates in value according to my blood sugar levels. $SUGAR was distributed according to a [fair launch](https://insights.deribit.com/market-research/yfi-a-tale-of-fair-launch-governance-and-value/), where for 1 week anyone could become a sugar daddy/mummy.

$DIA is a stablecoin that can only be backed by $SUGAR. DIA allows anyone to bet on good sugar level control, and iDIA to bet on the inverse.

## Setup.

```
# Chain
npx hardhat node

# Deploy
FRESH_DEPLOY=1 npx hardhat run --network local scripts/migrations/1_deploy_loans.ts

# SugarFeed keeper.
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 NETWORK=local npx ts-node sugarbot/index.ts sugarfeed-keeper --provider-url http://localhost:8545 --nightscout-url https://zediabetes.herokuapp.com

# SugarLoans keeper.
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 NETWORK=local npx ts-node sugarbot/index.ts sugarloans-keeper --provider-url http://localhost:8545 --from-block 1
```

