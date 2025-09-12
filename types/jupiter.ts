export interface JupiterToken {
  address: string
  chainId: string
  name: string
  symbol: string
  decimals: number
  logoUrl: string
  price: string
  coingeckoId: string
}

export interface JupiterLiquiditySupplyData {
  modeWithInterest: boolean
  supply: string
  withdrawalLimit: string
  lastUpdateTimestamp: string
  expandPercent: number
  expandDuration: string
  baseWithdrawalLimit: string
  withdrawableUntilLimit: string
  withdrawable: string
}

export interface JupiterPool {
  id: number
  address: string
  name: string
  symbol: string
  decimals: number
  assetAddress: string
  asset: JupiterToken
  totalAssets: string
  totalSupply: string
  convertToShares: string
  convertToAssets: string
  rewardsRate: string
  supplyRate: string
  totalRate: string
  rebalanceDifference: string
  liquiditySupplyData: JupiterLiquiditySupplyData
  rewards: any[]
}
