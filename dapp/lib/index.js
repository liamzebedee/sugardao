const optimismNetworkConfig = {
    chainId: '0x1a4',
    chainName: 'Optimism Local 2',
    // rpcUrls: ['http://ec2-3-26-43-36.ap-southeast-2.compute.amazonaws.com:8545'],
    rpcUrls: ['https://sugardao:3001/api/ovm-testnet'],
    // rpcUrls: ['https://sugardao.vercel.app/api/ovm-testnet'],
    blockExplorerUrls: ['https://local-explorer.optimism.io/'],
    iconUrls: [
        'https://optimism.io/images/metamask_icon.svg',
        'https://optimism.io/images/metamask_icon.png',
    ],
}

const addOptimismNetworkToMetamask = async ({ ethereum }) => {
    if (!ethereum || !ethereum.isMetaMask) throw new Error('Metamask is not installed');
    // const optimismNetworkConfig = getOptimismNetwork({ layerOneNetworkId: Number(ethereum.chainId) });
    return await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [optimismNetworkConfig],
    });
}




module.exports = {
    addOptimismNetworkToMetamask
}