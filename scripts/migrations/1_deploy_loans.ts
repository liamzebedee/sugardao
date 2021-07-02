import * as hre from "hardhat";
import "@nomiclabs/hardhat-ethers";
import * as pLimit from "p-limit";
import { writeFileSync } from "fs";
import { join } from "path";
const { gray, green, yellow, redBright, red } = require("chalk");

const w3utils = require("web3-utils");
const toBytes32 = (key) => w3utils.rightPad(w3utils.asciiToHex(key), 64);

const limitPromise = pLimit(4);

// Context.
let owner: string;
let deployedContracts: { [k: string]: any } = {};
let addressResolver;

// Functions.
async function deployContract({ contract, params }) {
  console.debug(`Deploying ${green(contract)}`);

  const Template = await hre.ethers.getContractFactory(contract);
  const instance = await Template.deploy(...params);
  const address = (await instance.deployed()).address;

  console.debug(`Deployed ${green(contract)} to ${address}`);

  deployedContracts[contract] = instance;

  return instance;
}

async function getContractsForImport() {
  const addressArgs = [[], []];

  await Promise.all(
    Object.entries(deployedContracts)
      .map(([name, contract]) => async () => {
        const isImported = await addressResolver.areAddressesImported(
          [toBytes32(name)],
          [contract.address]
        );

        if (!isImported) {
          console.log(
            green(`${name} needs to be imported to the AddressResolver`)
          );

          addressArgs[0].push(toBytes32(name));
          addressArgs[1].push(contract.address);
        }
      })
      .map(limitPromise)
  );

  return addressArgs;
}

async function waitTx(tx) {
  await (await tx).wait(1)
}

async function importAddresses(addressArgs) {
  await waitTx(addressResolver.importAddresses(...addressArgs))
  console.debug(`AddressResolver configured with new addresses`)
}

async function rebuildCaches(contracts) {
  for (let [name, contract] of Object.entries(deployedContracts)) {
    console.debug(`Rebuilding cache for ${green(name)}`)
    await waitTx(contract.rebuildCache())
  }
}

async function main() {
  // hre.ethers.provider.pollingInterval = 1
  console.log('DEPLOYING SUGAR INTO PRODUCTION')
  console.log('')

  // Setup.
  const signers = await hre.ethers.getSigners();
  owner = await signers[0].getAddress();

  // Deploy AddressResolver.
  // -----------------------

  const AddressResolver = await hre.ethers.getContractFactory(
    "AddressResolver"
  );
  addressResolver = await AddressResolver.deploy(owner);

  // Deploy SugarFeed and SugarOracle.
  // -----------------------

  await deployContract({
    contract: "SugarFeed",
    params: [owner, addressResolver.address],
  });

  await deployContract({
    contract: "SugarOracle",
    params: [owner, addressResolver.address]
  })

  // Import addresses.
  // -----------------

  console.debug("Updating the address resolver...");

  const addressArgs = await getContractsForImport();
  await importAddresses(addressArgs);
  await rebuildCaches(deployedContracts);

  // Ok. We are done.
  const deploymentFilePath = join(__dirname, `../../deployments/${hre.network.name}.json`)
  console.debug(`Saving deployment info to ${deploymentFilePath}`)
  let deployments = require(deploymentFilePath)
  // Update deployments.
  Object.entries(deployedContracts).forEach(([name, contract]) => {
    deployments["contracts"][name] = {
      address: contract.address,
      deployTransaction: contract.deployTransaction,
    };
  });
  // Save contract addresses.
  writeFileSync(deploymentFilePath, JSON.stringify(deployments, null, 4));

  console.debug("Done");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
