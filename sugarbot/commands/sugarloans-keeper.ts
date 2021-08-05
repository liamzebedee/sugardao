import * as ethers from "ethers";
import { utils } from "ethers";
import fetch from "node-fetch";
import { yellow, green, gray } from "chalk";

const network = process.env.NETWORK
const sugardao = require('../../')

// Helpers.

function fromMgToMmol(value) {
    return value / 18;
}

// Main.

const DEFAULTS = {
    providerUrl: "http://localhost:8545",
    fromBlock: 'latest',
};


// Network-specific defaults.

const useOvm = false

function getTxDefaults() {
    if (useOvm) {
        return {
            gasPrice: 0,
            gasLimit: 8.9e6,
        }
    }

    return {}
}

const txDefaults = getTxDefaults()


async function run({
    providerUrl = DEFAULTS.providerUrl,
    privateKey = process.env.PRIVATE_KEY,
    fromBlock = DEFAULTS.fromBlock,
    nightscoutUrl
}: any = {}) {
    fromBlock = fromBlock === 'latest' ? fromBlock : parseInt(fromBlock)

    console.log('Connecting to provider: ' + providerUrl)
    const provider = new ethers.providers.JsonRpcProvider(providerUrl)
    provider.pollingInterval = 50

    const signer = privateKey
        ? new ethers.Wallet(privateKey, provider)
        : await provider.getSigner()
    const account = await signer.getAddress()

    const {
        SugarFeed: sugarFeed,
        SugarOracle: sugarOracle,
        SugarLoans
    } = sugardao.getContracts({ network, signerOrProvider: signer });

    // Sanity check.
    // const owner = await sugarFeed.owner()
    // if (owner != account) {
    //     throw new Error(`SugarFeed has different owner to configured account.\n owner:${owner}\n configured account:${account}`)
    // }

    console.log(`Using account ` + green(account))

    // Loans to keep track of.
    let accounts = new Set()
    
    console.log(gray(`Rebuilding index from `), `${fromBlock} ... latest`);
    const events = await SugarLoans.queryFilter('*', fromBlock, 'latest');
    for (let { event, args } of events) {
        if (["Deposit", "Borrow"].includes(event)) {
            accounts.add(args.account)
        }
        if (event === "Liquidated") {
            accounts.delete(args.account)
        }
    }

    console.log(`${accounts.size} loan positions to track.`)

    provider.on('block', async () => {
        console.log('Checking positions...')

        for(let account of Array.from(accounts)) {
            if(await SugarLoans.canLiquidate(account)) {
                console.log(`Liquidating account ${account}`)
                const tx = await SugarLoans.liquidate(account)
                await tx.wait()
                console.log(`Liquidating account ${account} (done)`)
            }
        }
    })

    await new Promise((resolve, reject) => { });
}

module.exports = {
    cmd: (program) =>
        program
            .command('sugarloans-keeper')
            .description('Run SugarLoans keeper node')
            .option(
                '-p, --provider-url <value>',
                'Ethereum network provider URL. If default, will use PROVIDER_URL found in the .env file.'
            )
            .option(
                '-b, --from-block <value>',
                'Rebuild the keeper index from a starting block, before initiating keeper actions.',
                DEFAULTS.fromBlock
            )
            .action(async (...args) => {
                try {
                    await run(...args);
                } catch (err) {
                    // show pretty errors for CLI users
                    console.error(err);
                    console.log(err.stack);
                    process.exitCode = 1;
                }
            }),
};
