import { useState, useEffect, useContext, createContext } from 'react'
import { addOptimismNetworkToMetamask } from '../../lib'
import { useWeb3React } from '@web3-react/core'

import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'
import * as ethers from 'ethers'


// const network = new NetworkConnector({ 
//     urls: { 
//         // 1: RPC_URLS[1]
//         420: 'https://sugardao.vercel.app/api/ovm-testnet'
//     } 
// })

// const injected = new InjectedConnector({
//     supportedChainIds: [1,69,420]
// })

const NetworkIndicator = ({ chainId }) => {
    // const { chainId } = useWeb3React()
    if (chainId === 31337) {
        return 'SUGAR OVM'
    } else {
        return `Wrong network (${chainId}, expected ${420}).`
    }
}

import { useWeb3 } from '../../components/ethereum'





export default function OpenLoan() {
    const { activate, chainId, account, providerActive } = useWeb3()

    async function connectWallet() {
        try {
            await activate()
            await addOptimismNetworkToMetamask({ ethereum: window.ethereum, })
        } catch (ex) {
            console.error(ex)
        }
    }

    return <>
        <pre>
Account: {account}{'\n'}
Network: <NetworkIndicator chainId={chainId} /> 
        </pre>

        { !providerActive && <button onClick={connectWallet}>Connect wallet</button> }

        <h2>Open a loan</h2>
        
    </>
}