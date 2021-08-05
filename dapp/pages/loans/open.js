import { useState, useEffect, useContext, createContext } from 'react'
import { useWeb3React } from '@web3-react/core'

import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import * as ethers from "ethers";
const sprintf = require('sprintf-js').sprintf
import { atom, useRecoilState, useRecoilValue, selector } from 'recoil'
const sugardao = require('../../../')
import * as config from '../../lib/config'
import { useQuery, QueryConfig } from 'react-query';
import styles from '../../styles/OpenLoan.module.css'

const NetworkIndicator = ({ chainId }) => {
    if (chainId === 31337) {
        return 'local'
    } else {
        return `Wrong network (${chainId}, expected ${420}).`
    }
}

import { useWeb3 } from '../../components/ethereum'
import { formatEther, parseEther } from '../../lib/utils'
import { fromWei } from 'web3-utils';

const pricesState = atom({
    key: 'prices',
    default: null,
});
const balancesState = atom({
    key: 'balances',
    default: {
        SUGAR: null,
        DIA: null,
        iDIA: null
    },
});

const positionSizeState = selector({
    key: 'positionSize',
    get: ({ get }) => {
        const balances = get(balancesState)
        const prices = get(pricesState)
        if (!balances.DIA || !prices) return ethers.constants.Zero

        return balances.DIA.mul(prices[0]).div(parseEther('1.0'))
            .add(balances.iDIA.mul(prices[1])).div(parseEther('1.0'))
    }
})



function useLoadEffect(fn, deps=[]) {
    const [loaded, setLoaded] = useState(false)
    const done = () => setLoaded(true)

    useEffect(() => {
        if(!loaded) {
            fn(done)
        }
    }, [loaded, setLoaded])
}

export default function OpenLoan() {
    const { activate, chainId, account, providerActive, provider, active, signer } = useWeb3()
    const [prices, setPrices] = useRecoilState(pricesState)
    const [balances, setBalances] = useRecoilState(balancesState)
    const positionSize = useRecoilValue(positionSizeState)

    async function connectWallet() {
        try {
            await activate({ supportedChainIds: [31337] })
        } catch (ex) {
            console.error(ex)
        }
    }

    async function trackTokenBalance(token, tokenKey, account) {
        function cb() {
            const balance = token.balanceOf(account)
            setBalances({
                ...balances,
                [tokenKey]: balance
            })
        }
        token.on('Transfer', cb)
        token.on('Issued', cb)
        token.on('Burned', cb)
    }

    async function trackPrices(feed) {
        const {
            SugarOracle,
            SugarFeed
        } = sugardao.getContracts({ network: config.network, signerOrProvider: provider });

        function cb() {
            let prices = SugarOracle.getPrices()
            setPrices(prices)
        }

        SugarFeed.on('Update', cb)
    }

    async function loadInfo() {
        const {
            SugarOracle,
            SUGAR,
            DIA,
            iDIA
        } = sugardao.getContracts({ network: config.network, signerOrProvider: provider });
        
        const prices = await SugarOracle.getPrices()
        setPrices(prices)

        const balances = {
            SUGAR: await SUGAR.balanceOf(account),
            DIA: await DIA.balanceOf(account),
            iDIA: await iDIA.balanceOf(account),
        }
        trackTokenBalance(DIA, 'DIA', account)
        trackTokenBalance(SUGAR, 'SUGAR', account)
        trackTokenBalance(iDIA, 'iDIA', account)

        setBalances(balances)

        return { balances, prices }
    }

    useEffect(() => {
        connectWallet()
    }, [])

    const { data, error } = useQuery(
        'load',
        loadInfo,
        {
            enabled: active,
        }
    );
    
    const [formData, setFormData] = useState({
        amount: '',
        direction: 1
    })
    const [ modifyPositionStatus, setModifyPositionStatus ] = useState('')

    function setFormField(key, value) {
        setFormData({
            ...formData,
            [key]: value
        })
    }

    async function modifyPosition() {
        const {
            SugarLoans,
            SUGAR
        } = sugardao.getContracts({ network: config.network, signerOrProvider: signer });
        setFormData({
            ...formData,
            loading: true,
        })
        setModifyPositionStatus('tx 1/2 approving')
        let tx
        const allowance = await SUGAR.allowance(account, SugarLoans.address)
        const MAX_ALLOWANCE = ethers.constants.MaxUint256
        if (!allowance.eq(MAX_ALLOWANCE)) {
            tx = await SUGAR.approve(SugarLoans.address, MAX_ALLOWANCE)
            await tx.wait()
        }

        let { direction, amount } = formData
        amount = parseEther(amount + (!amount.includes('.') ? '.' : ''))
        setModifyPositionStatus('tx 2/2 open loan')
        tx = await SugarLoans.open(direction, amount)
        await tx.wait()

        setModifyPositionStatus('done!')
        
        setFormData({
            loading: false,
            amount: '',
            direction: 1
        })
    }

    const formValid = !!formData.amount.length
    const formLoading = formData.loading

    return <div className={styles.container1}>
        <div className={styles.container2}>
            <pre>{`
Account: ${account}
Network: ${NetworkIndicator({chainId})}

Prices:
DIA  = ${sprintf("%0s", data && formatEther(data.prices[0]) ) }
iDIA = ${sprintf("%0s", data && formatEther(data.prices[1])) }

Balances:
SUGAR ${sprintf("%20s", data && formatEther(data.balances.SUGAR)) }
DIA   ${sprintf("%20s", data && formatEther(data.balances.DIA)) }
iDIA  ${sprintf("%20s", data && formatEther(data.balances.iDIA)) }
`}
            </pre>

            { !providerActive && <button onClick={connectWallet}>Connect wallet</button> }

            <p><strong>Position</strong></p>
            <pre>Current Size: {sprintf("%20s", formatEther(positionSize))} SUGAR</pre>
            <div>
                <input type='number' placeholder="0.0 SUGAR" value={formData.amount} onChange={({ target: { value } }) => setFormField('amount', value)}/>  
            </div>
            <input type="radio" id="dia" checked={formData.direction} onChange={({ target: { value } }) => setFormField('direction', 1)} /> <label for="dia">DIA</label>
            <input type="radio" id="idia" checked={!formData.direction} onChange={({ target: { value } }) => setFormField('direction', 0)} /> <label for="idia">iDIA</label>
            <div>
                <button onClick={modifyPosition} disabled={!formValid || formLoading}>
                    { positionSize.gt(0) ? 'Modify' : 'Open' }
                </button>
            {modifyPositionStatus}
            </div>
        </div>
    </div>
}
