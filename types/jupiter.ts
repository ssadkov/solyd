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

// Типы для пользовательских позиций Jupiter Lend
export interface JupiterUserPosition {
  token: JupiterPool
  ownerAddress: string
  shares: string
  underlyingAssets: string
  underlyingBalance: string
  allowance: string
}

// Расширенный интерфейс для пользовательских позиций с дополнительными данными
export interface JupiterUserPositionExtended {
  token: JupiterPool
  ownerAddress: string
  shares: string
  underlyingAssets: string
  underlyingBalance: string
  allowance: string
  // Вычисляемые поля
  totalValue: number
  apy: number
  withdrawable: string
  isActive: boolean
}

// Типы для earnings API
export interface JupiterEarnings {
  address: string
  ownerAddress: string
  totalDeposits: string
  totalWithdraws: string
  totalBalance: string
  totalAssets: string
  earnings: string
  updatedAt: string
  updatedAtSlot: number
}

// Расширенный интерфейс для earnings с вычисляемыми полями
export interface JupiterEarningsExtended extends JupiterEarnings {
  earningsValueUSD: number
  tokenSymbol: string
  tokenDecimals: number
  tokenPrice: string
}