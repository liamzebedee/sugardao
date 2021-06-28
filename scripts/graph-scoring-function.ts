// import '@nomiclabs/hardhat-ethers'
import * as ethers from "ethers";
import { utils } from "ethers";
const deployments = require("../deployments/mainnet-polygon.json");

async function main({ privateKey }) {
  const provider = new ethers.providers.JsonRpcProvider();
  let signer = privateKey
    ? new ethers.Wallet(privateKey)
    : await provider.getSigner();
  const account = await signer.getAddress();

  const sugarLoans = new ethers.Contract(
    deployments.contracts["SugarLoans"].address,
    require("../artifacts/contracts/system/SugarLoans.sol/SugarLoans.json").abi,
    signer
  );

  console.log(`Blood Glucose Level,DIA price`);
  for (let bgl = 0; bgl < 24; bgl += 0.1) {
    const score = await sugarLoans.score(utils.parseEther("" + bgl));
    console.log(`${bgl},${utils.formatEther(score)}`);
  }
}

main({ privateKey: null })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
