import { useEffect } from 'react'
import { addOptimismNetworkToMetamask } from '../../lib'

export default function OpenLoan() {
    useEffect(() => {
        addOptimismNetworkToMetamask({ ethereum: window.ethereum })
    }, [])

    return ''
}