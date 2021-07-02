import '../styles/globals.css'
import { Web3ContextProvider } from '../components/ethereum'
import * as ethers from 'ethers'
import { createContext } from 'react'
import {
  RecoilRoot,
} from 'recoil'

function getLibrary(provider, connector) {
  return new ethers.providers.Web3Provider(provider) // this will vary according to whether you use e.g. ethers or web3.js
}

function MyApp({ Component, pageProps }) {
  return <>
    <RecoilRoot>
      <Web3ContextProvider>
        <Component {...pageProps} />
      </Web3ContextProvider>
    </RecoilRoot>
  </>
}

export default MyApp
