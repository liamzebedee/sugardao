import * as hre from "hardhat";
import "@nomiclabs/hardhat-ethers";
import * as pLimit from "p-limit";
import { writeFileSync } from "fs";
import { join } from "path";
const { gray, green, yellow, redBright, red } = require("chalk");

const w3utils = require("web3-utils");
const toBytes32 = (key) => w3utils.rightPad(w3utils.asciiToHex(key), 64);
const ZERO_ADDRESS = '0x' + '0'.repeat(40)

const limitPromise = pLimit(4);

// Context.
let owner: string;
let deployments
let deployedContracts: { [k: string]: any } = {};
let addressResolver;

// Functions.
async function deployContract({ contract, params, force = false, name = undefined }) {
  let target = name || contract

  if (deployments.contracts[target] && !force) {
    console.debug(gray(`Skipping ${target}, as it is already deployed`));
    return hre.ethers.getContractAt(contract, deployments.contracts[target].address)
  }

  console.debug(`Deploying ${green(target)}`);

  const Template = await hre.ethers.getContractFactory(contract);

  const instance = await Template.deploy(...params);
  const address = (await instance.deployed()).address;

  console.debug(`Deployed ${green(target)} to ${address}`);

  deployedContracts[target] = {
    instance,
    bytecode: Template.bytecode,
    abi: JSON.parse(Template.interface.format("json") as string) 
  }

  return instance;
}

async function getContractsForImport() {
  const addressArgs = [[], []];

  await Promise.all(
    Object.entries(deployedContracts)
      .map(([name, contract]) => async () => {
        const { instance } = contract
        // Skip AddressResolver.
        if(name == 'AddressResolver') return

        const isImported = await addressResolver.areAddressesImported(
          [toBytes32(name)],
          [instance.address]
        );

        if (!isImported) {
          console.log(
            green(`${name} needs to be imported to the AddressResolver`)
          );

          addressArgs[0].push(toBytes32(name));
          addressArgs[1].push(instance.address);
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

const mixedWithResolver = contract => !!contract['rebuildCache']
async function rebuildCaches() {
  for (const [name, contract] of Object.entries(deployedContracts).filter(x => mixedWithResolver(x[1].instance))) {
    console.debug(`Rebuilding cache for ${green(name)}`)
    await waitTx(contract.instance.rebuildCache())
  }
}

function addressOf(contract) {
  if (!contract.address) new Error("no address")
  return contract.address
}

async function main() {
  // hre.ethers.provider.pollingInterval = 1
  console.log('DEPLOYING SUGAR INTO PRODUCTION')
  console.log('')

  // Setup.
  const signers = await hre.ethers.getSigners();
  owner = await signers[0].getAddress();

  const deploymentFilePath = join(__dirname, `../../deployments/${hre.network.name}.json`)
  if(process.env.FRESH_DEPLOY) {
    deployments = {
      contracts: {}
    }
  } else {
    deployments = require(deploymentFilePath)
  }

  // Deploy AddressResolver.
  // -----------------------

  // addressResolver = await deployContract({
  //   contract: "AddressResolver",
  //   params: [owner]
  // })

  // Deploy GlucoseFeed and SugarOracle.
  // -----------------------

  let addressResolver = {
    address: owner
  }
  const glucoseFeed = await deployContract({
    contract: "GlucoseFeed",
    params: [owner, addressResolver.address],
  });

  const daobetic = await deployContract({
    contract: "Daobetic",
    params: [owner, addressResolver.address],
    force: true
  });

  await waitTx(
    daobetic.setFeed(glucoseFeed.address)
  )

  // await waitTx(
  //   glucoseFeed.post(70, Math.floor(Date.now() / 1000))
  // )

  // Import addresses.
  // -----------------

  console.debug("Updating the address resolver...");

  // const addressArgs = await getContractsForImport();
  // if (addressArgs.length) {
  //   await importAddresses(addressArgs);
  //   await rebuildCaches();
  // }

  // Ok. We are done.
  console.debug(`Saving deployment info to ${deploymentFilePath}`)
  // Update deployments.
  Object.entries(deployedContracts).forEach(([name, contract]) => {
    const { instance, abi, bytecode } = contract
    deployments["contracts"][name] = {
      address: instance.address,
      deployTransaction: instance.deployTransaction,
      abi,
      bytecode
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
