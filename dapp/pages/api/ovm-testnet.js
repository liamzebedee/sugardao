const ETH_RPC_URL = 'http://ec2-3-26-43-36.ap-southeast-2.compute.amazonaws.com:8545'
// import 'node-fetch'

const bent = require('bent')




export default async function handler(req, res) {
    // const node_res = await fetch(ETH_RPC_URL, {
    //     body: req.body
    // })
    // res.status(200).json(await node_res.json())

    const response = await bent('GET', 'json')(ETH_RPC_URL, req.body)
    res.status(200).json(response)
}
