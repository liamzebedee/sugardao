import * as ethers from "ethers";
import { utils } from "ethers";
import fetch from "node-fetch";
import { yellow, green } from "chalk";

const network = process.env.NETWORK
const sugardao = require('../../')

// Helpers.

function fromMgToMmol(value) {
  return value / 18;
}

// Main.

const DEFAULTS = {
  providerUrl: "http://localhost:8545",
};


// Network-specific defaults.

const useOvm = false

function getTxDefaults() {
	if(useOvm) {
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
	nightscoutUrl
}: any = {}) {
	console.log('Connecting to provider: ' + providerUrl)
	const provider = new ethers.providers.JsonRpcProvider(providerUrl)
	provider.pollingInterval = 50

	const signer = privateKey
		? new ethers.Wallet(privateKey, provider)
		: await provider.getSigner()
	const account = await signer.getAddress()

	const { 
		GlucoseFeed: glucoseFeed,  
	} = sugardao.getContracts({ network, signerOrProvider: signer });

	// Sanity check.
	const owner = await glucoseFeed.owner()
	if (owner != account) {
		throw new Error(`SugarFeed has different owner to configured account.\n owner:${owner}\n configured account:${account}`)
	}

	console.log(`Using account ` + green(account))


	// Get state.
	async function getLastUpdated() {
		let latest = await glucoseFeed.latest()
		return new Date(latest.lastUpdatedTime.toNumber())
	}
	let lastUpdatedTime = await getLastUpdated()
	console.log(`Last updated: ${lastUpdatedTime}`)

	// Setup events.
	glucoseFeed.on('Update', async (value) => {
		lastUpdatedTime = await getLastUpdated()
		// logPrice()
		console.log(`${green('Update')}(value=${utils.formatEther(value)})`)
	})

	// async function logPrice() {
	// 	const price = await sugarOracle.getPrice()
	// 	console.log(`$SUGAR = $` + yellow(utils.formatEther(price)))
	// }

	// Run main event loop.
	async function pollAndPost() {
		// Poll.
		console.debug(`Polling Nightscout for BG's`)
		const BG_URL = new URL(`/api/v1/entries/sgv.json`, nightscoutUrl)
		const res = await fetch(BG_URL)
		const data = await res.json()

		// Post.
		if(data.length == 0) {
			throw new Error("No glucose data from Nightscout.")
		}
		const latest = data[0]
		const { date, sgv } = latest
		if(date <= lastUpdatedTime) {
			return	
		}
		console.debug(`Updating SugarFeed`)

		try {
			
			// const tx = await sugarFeed.post(
			// 	utils.parseEther(`${fromMgToMmol(sgv)}`),
			// 	+(new Date),
			// 	txDefaults
			// )

			// clamp to range 0-25
			let val = Math.min(fromMgToMmol(sgv), 25)
			// now reduce dp's to 1.
			val = Math.round(val * 10)
			let ts = Math.floor(Date.now() / 1000)

			const tx = await glucoseFeed.post(
				ethers.BigNumber.from("" + val),
				ethers.BigNumber.from("" + ts)
			)
			await tx.wait(1)
		} catch (ex) {
			throw ex
		}
	}

	const POLL_INTERVAL = 1000 * 60 * 5
	await pollAndPost()
	const timeout = setInterval(() => pollAndPost(), POLL_INTERVAL)
}


module.exports = {
	cmd: (program) =>
		program
			.command('sugarfeed-keeper')
			.description('Run sugarfeed keeper node')
			.option(
				'-p, --provider-url <value>',
				'Ethereum network provider URL. If default, will use PROVIDER_URL found in the .env file.'
			)
			.option(
				'--nightscout-url <value>',
				'The nightscout URL'
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
