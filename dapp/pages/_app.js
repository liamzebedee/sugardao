import '../styles/globals.css'
import { Web3ReactProvider } from '@web3-react/core'
import * as ethers from 'ethers'
import { createContext } from 'react'

function getLibrary(provider, connector) {
  return new ethers.providers.Web3Provider(provider) // this will vary according to whether you use e.g. ethers or web3.js
}

function MyApp({ Component, pageProps }) {
  return <>
    <Web3ReactProvider getLibrary={getLibrary}>
      <EthereumContext.Provider>
        <Component {...pageProps} />
      </EthereumContext.Provider>
    </Web3ReactProvider>
  </>
}

export default MyApp
