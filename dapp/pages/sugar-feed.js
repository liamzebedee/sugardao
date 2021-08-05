import { Chart } from '../components/Chart'
// import { Chart } from '../components/CandleChart'

import { request, gql } from 'graphql-request'
import { useEffect } from 'react'
import * as config from '../lib/config'
import { utils } from 'ethers'
import { atom, useRecoilState } from 'recoil'

const query = gql`
{
  sugarFeedUpdates(first: 120, orderBy: timestamp, orderDirection: desc) {
    id
    timestamp
    value
  }
}
`

const bgsState = atom({
	key: 'bgs',
	default: [],
});


const bgsChartTransformer = (x) => {
	const { timestamp, value } = x

	return {
		date: +new Date(Number(timestamp)),
		sgv: Number(utils.formatEther(value))
	}
}

export default function SugarFeed() {
	const [bgs, setBgs] = useRecoilState(bgsState);
	useEffect(() => {
		request(config.subgraphs.sugardao, query).then((data) => {
			setBgs(data.sugarFeedUpdates)
		})
	}, [])

	return <>
		<h1>SugarFeed</h1>
		<Chart data={bgs.map(bgsChartTransformer)}/>
		<small>
			The SugarFeed loads sugar data from the diabetic, which is fed into the SugarOracle for price synthesis.
		</small>
	</>
}
