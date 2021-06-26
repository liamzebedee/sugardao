import { useState, useEffect } from 'react'
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

function useEthereum() {
    const [state, setState] = useState({
        chainId: null,
        account: null,
        provider: null,
        signer: null,
        providerActive: false
    })

    async function activate() {
        await window.ethereum.enable();
        
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any")

        const { chainId, name } = await provider.getNetwork()
        const signer = provider.getSigner()
        const account = await signer.getAddress()
        
        
        // 
        // Detect network changes.
        // 
        // 

        async function loadNetwork() {
            const { chainId, name } = await provider.getNetwork()
            const signer = provider.getSigner()
            const account = await signer.getAddress()
            setState({
                ...state,
                chainId,
            })
        }

        // async function checkNetwork() {
        //     const { chainId, name } = await provider.getNetwork()
        //     if (state.chainId != chainId) {
        //         loadNetwork()
        //     }
        // }

        // setInterval(checkNetwork, 200)

        // window.ethereum.on('accountsChanged', function (accounts) {
        //     console.log('accountsChanges', accounts);
        // });

        // window.ethereum.on('chainChanged', function (networkId) {
        //     loadNetwork()
        // });

        // provider.on("network", (newNetwork, oldNetwork) => {
        //     const { chainId, name } = newNetwork
        //     setState({
        //         ...state,
        //         chainId,
        //     })
        // })

        setState({
            ...state,
            chainId,
            provider,
            account,
            signer,
            providerActive: true
        })
    }

    const { chainId, account } = state
    return { ...state, activate }
}

export default function OpenLoan() {
    const { activate, chainId, account, providerActive } = useEthereum()

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
    </>
}