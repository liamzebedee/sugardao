import { useEffect } from 'react'
import { addOptimismNetworkToMetamask } from '../../lib'
import { initialiseWeb3 } from '../../lib/web3'

export default function OpenLoan() {
    useEffect(async () => {
        await initialiseWeb3()
        await addOptimismNetworkToMetamask({ ethereum: window.ethereum })
    }, [])

    return ''
}