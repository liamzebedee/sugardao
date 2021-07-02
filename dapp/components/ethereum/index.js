import React, { useReducer } from 'react'

import { useState, useEffect, useContext, createContext } from 'react'
import { useWeb3React } from '@web3-react/core'

import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'
import * as ethers from 'ethers'

const Context = React.createContext()

function useWeb3() {
    return useContext(Context)
}

const Web3ContextProvider = ({ children }) => {
    const [state, setState] = useState({
        chainId: null,
        account: null,
        provider: null,
        signer: null,
        providerActive: false,
        active: false
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
            providerActive: true,
            active: true
        })
    }

    let methods = {
        activate
    }

    let value = {
        ...state,
        ...methods
    }

    return <Context.Provider value={value}>
        {children}
    </Context.Provider>
}

module.exports = { 
    useWeb3,
    Web3ContextProvider
}