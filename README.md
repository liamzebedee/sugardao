daobetic
========

become a daobetic, get exposure to $SUGAR today.

* sugardao: the diabetic dao
* DIA: diabetes-backed stablecoin


## Setup.

```
# Chain
npx hardhat node

# Deploy
npx hardhat run scripts/migrations/1_deploy_loans.ts

# Sugar feed bot.
ts-node sugarbot/index.ts node --provider-url http://localhost:8545 --nightscout-url https://EXAMPLE
```