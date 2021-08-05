

// const optimismNetworkConfigs = {
// 	test: {
// 		chainId: '0x1a4',
// 		chainName: 'Optimism Testnet',
// 		rpcUrls: ['https://sugardao.vercel.app/api/ovm-testnet'],
// 		blockExplorerUrls: ['https://local-explorer.optimism.io/'],
// 		iconUrls: [
// 			'https://optimism.io/images/metamask_icon.svg',
// 			'https://optimism.io/images/metamask_icon.png',
// 		],
// 	},

// 	local: {
// 		chainId: '0x1a4',
// 		chainName: 'Optimism Local',
// 		rpcUrls: ['https://sugardao:3001/api/ovm-testnet'],
// 		blockExplorerUrls: ['https://local-explorer.optimism.io/'],
// 		iconUrls: [
// 			'https://optimism.io/images/metamask_icon.svg',
// 			'https://optimism.io/images/metamask_icon.png',
// 		],
// 	},
// };

const subgraphs = {
	kovan: {
		sugardao: 'https://api.thegraph.com/subgraphs/name/liamzebedee/sugardao-kovan'
	},
	local: {
		sugardao: 'https://api.thegraph.com/subgraphs/name/liamzebedee/sugardao-local'
	}
}

// const addOptimismNetworkToMetamask = async ({ ethereum }) => {
// 	if (!ethereum || !ethereum.isMetaMask) throw new Error('Metamask is not installed');
// 	return ethereum.request({
// 		method: 'wallet_addEthereumChain',
// 		params: [optimismNetworkConfigs.test],
// 	});
// };


function load({ network }) {
	return Object.entries({
		subgraphs,
	})
	.map(([key, config]) => {
		if (!(network in config)) {
			throw new Error(`No config '${key}' for network ${network}`)
		}
		return { 
			[key]: config[network] 
		}
	})
	.reduce((prev, curr) => Object.assign(prev, curr), { network })
}

console.log(process.env.NETWORK)
module.exports = load({
	network: process.env.NETWORK
})