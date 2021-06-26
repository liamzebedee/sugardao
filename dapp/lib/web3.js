// import Web3 from "web3";
import Web3Modal from "web3modal";

const providerOptions = {
};

async function initialiseWeb3() {
    const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
        providerOptions
    });

    const provider = await web3Modal.connect();
    return provider
    // const web3 = new Web3(provider);
}

module.exports = {
    initialiseWeb3
}