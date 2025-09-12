export interface AggregatorToken {
  symbol: string
  address: string
  decimals: number
  logo: string
  price: number
}

export interface AggregatorData {
  token: AggregatorToken
  apy: number
  tvl: number
  protocol: string
  category: 'lending' | 'rewards' | 'liquidity' | 'staking'
  isActive: boolean
  lastUpdated: string
}

export interface AggregatorStats {
  totalProtocols: number
  totalTVL: number
  averageAPY: number
  activePools: number
}
