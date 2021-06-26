
import * as hre from 'hardhat'
import '@nomiclabs/hardhat-ethers'
import * as pLimit from 'p-limit'
import { writeFileSync } from 'fs'
import { join } from 'path'
const { gray, green, yellow, redBright, red } = require('chalk');

const w3utils = require('web3-utils');
const toBytes32 = key => w3utils.rightPad(w3utils.asciiToHex(key), 64);

const limitPromise = pLimit(4);


// Context.
let owner: string
let deployedContracts: { [k: string]: any } = {}
let addressResolver

// Functions.
async function deployContract({ contract, params }) {
  console.debug(`Deploying ${green(contract)}`)

  const Template = await hre.ethers.getContractFactory(contract);
  const instance = await Template.deploy(
    ...params
  );
  const address = (await instance.deployed()).address

  console.debug(`Deployed ${green(contract)} to ${address}`)

  deployedContracts[contract] = instance

  return instance
}

async function getContractsForImport() {
  const addressArgs = [[], []];

  await Promise.all(
    Object.entries(deployedContracts)
      .map(([name, contract]) => async () => {
        const isImported = await addressResolver
          .areAddressesImported([toBytes32(name)], [contract.address]);

        if (!isImported) {
          console.log(green(`${name} needs to be imported to the AddressResolver`));

          addressArgs[0].push(toBytes32(name));
          addressArgs[1].push(contract.address);
        }
      })
      .map(limitPromise)
  );

  return addressArgs
}

async function importAddresses(addressArgs) {
  await addressResolver.importAddresses(...addressArgs)
  console.debug(`AddressResolver configured with new addresses`)
}

async function rebuildCaches(contracts) {
  await Promise.all(
    Object.entries(deployedContracts)
      .map(([name, contract]) => async () => {
        console.debug(`Rebuilding cache for ${green(name)}`)
        await contract.rebuildCache()
      })
      .map(limitPromise)
  )
}



async function main() {
  // Setup.
  const signers = await hre.ethers.getSigners()
  owner = await signers[0].getAddress()

  // Deploy AddressResolver.
  // -----------------------

  const arb = await deployContract({
    contract: "TheSpyThatArbedMe",
    params: [
      // LendingPoolAddressesProvider
      '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5'
    ]
  })

  console.debug('Running arb')
  await (await arb.run()).wait(1)


  // Ok. We are done.
  const deploymentFilePath = join(__dirname, '../../deployments/mainnet-polygon.json')
  console.debug(`Saving deployment info to ${deploymentFilePath}`)
  let deployments = require(deploymentFilePath)
  // Update deployments.
  Object.entries(deployedContracts)
    .forEach(([name, contract]) => {
      deployments['contracts'][name] = {
        address: contract.address,
        deployTransaction: contract.deployTransaction,
      };
    })
  // Save contract addresses.
  writeFileSync(deploymentFilePath, JSON.stringify(deployments, null, 4))

  console.debug('Done')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
