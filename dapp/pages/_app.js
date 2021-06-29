import '../styles/globals.css'
import { Web3ContextProvider } from '../components/ethereum'
import * as ethers from 'ethers'
import { createContext } from 'react'

function getLibrary(provider, connector) {
  return new ethers.providers.Web3Provider(provider); // this will vary according to whether you use e.g. ethers or web3.js
}

function MyApp({ Component, pageProps }) {
  return <>
    {/* <Web3ReactProvider getLibrary={getLibrary}> */}
      <Web3ContextProvider>
        <Component {...pageProps} />
      </Web3ContextProvider>
    {/* </Web3ReactProvider> */}
  </>
}

export default MyApp;
