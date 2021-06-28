import * as ethers from "ethers";
import { utils, BigNumber } from "ethers";
import * as w3utils from "web3-utils";
import fetch from "node-fetch";
import { yellow, green } from "chalk";

const deployments = require("../../deployments/mainnet-polygon.json");

// Helpers.

function fromMgToMmol(value) {
  return value / 18;
}

// Main.

const DEFAULTS = {
  providerUrl: "http://localhost:8545",
};

async function run({
  providerUrl = DEFAULTS.providerUrl,
  privateKey,
  nightscoutUrl,
}: any = {}) {
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  let signer = privateKey
    ? new ethers.Wallet(privateKey)
    : await provider.getSigner();
  const account = await signer.getAddress();

  const sugarFeed = new ethers.Contract(
    deployments.contracts["SugarFeed"].address,
    require("../../artifacts/contracts/system/SugarFeed.sol/SugarFeed.json").abi,
    signer
  );
  const sugarLoans = new ethers.Contract(
    deployments.contracts["SugarLoans"].address,
    require("../../artifacts/contracts/system/SugarLoans.sol/SugarLoans.json").abi,
    signer
  );

  // Sanity check.
  const owner = await sugarFeed.owner();
  if (owner != account) {
    throw new Error(
      `SugarFeed has different owner to configured account.\n owner:${owner}\n configured account:${account}`
    );
  }

  // Setup events.
  sugarFeed.on("Update", (value) => {
    logPrice();
    console.log(`${green("Update")}(value=${utils.formatEther(value)})`);
  });

  async function logPrice() {
    const price = await sugarLoans.getPrice();
    console.log(`$SUGAR = $` + yellow(utils.formatEther(price)));
  }

  // Run main event loop.
  async function pollAndPost() {
    // Poll.
    console.debug(`Polling Nightscout for BG's`);
    const BG_URL = new URL(`/api/v1/entries/sgv.json`, nightscoutUrl);
    const res = await fetch(BG_URL);
    const data = await res.json();

    // Post.
    console.debug(`Updating SugarFeed`);
    const latest = data[0];
    const { date, sgv } = latest;
    const tx = await sugarFeed.post(utils.parseEther(`${fromMgToMmol(sgv)}`));
    await tx.wait(1);
  }

  const POLL_INTERVAL = 1000 * 60 * 2;
  await pollAndPost();
  const timeout = setInterval(() => pollAndPost(), POLL_INTERVAL);
}

module.exports = {
  cmd: (program) =>
    program
      .command("node")
      .description("Run sugar feed node")
      .option(
        "-p, --provider-url <value>",
        "Ethereum network provider URL. If default, will use PROVIDER_URL found in the .env file."
      )
      .option(
        "-v, --private-key [value]",
        "The private key to deploy with (only works in local mode, otherwise set in .env)."
      )
      .option("--nightscout-url [value]", "The nightscout URL")
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
