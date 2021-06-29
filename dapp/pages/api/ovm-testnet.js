const ETH_RPC_URL = 'http://ec2-3-26-43-36.ap-southeast-2.compute.amazonaws.com:8545';

const bent = require('bent');

export default async function handler(req, res) {
	const response = await bent('GET', 'json')(ETH_RPC_URL, req.body);
	res.status(200).json(response);
}
