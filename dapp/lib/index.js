const optimismNetworkConfigs = {
  test: {
    chainId: "0x1a4",
    chainName: "Optimism Testnet",
    rpcUrls: ["https://sugardao.vercel.app/api/ovm-testnet"],
    blockExplorerUrls: ["https://local-explorer.optimism.io/"],
    iconUrls: [
      "https://optimism.io/images/metamask_icon.svg",
      "https://optimism.io/images/metamask_icon.png",
    ],
  },

  local: {
    chainId: "0x1a4",
    chainName: "Optimism Local",
    rpcUrls: ["https://sugardao:3001/api/ovm-testnet"],
    blockExplorerUrls: ["https://local-explorer.optimism.io/"],
    iconUrls: [
      "https://optimism.io/images/metamask_icon.svg",
      "https://optimism.io/images/metamask_icon.png",
    ],
  },
};

const addOptimismNetworkToMetamask = async ({ ethereum }) => {
  if (!ethereum || !ethereum.isMetaMask)
    throw new Error("Metamask is not installed");
  return await ethereum.request({
    method: "wallet_addEthereumChain",
    params: [optimismNetworkConfigs.test],
  });
};

module.exports = {
  addOptimismNetworkToMetamask,
};
