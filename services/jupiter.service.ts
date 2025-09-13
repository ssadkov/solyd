import { JupiterPool, JupiterUserPosition } from '@/types/jupiter'
import { AggregatorData } from '@/types/aggregator'
import { ProtocolService, UserPosition, ProtocolTransaction } from '@/types/protocol'

export class JupiterService implements ProtocolService {
  name = 'Jupiter'
  category = 'lending' as const
  logo = 'https://jup.ag/favicon.ico'
  
  private readonly baseUrl = 'https://lite-api.jup.ag/lend/v1'
  private readonly timeout = 10000 // 10 seconds

  async getLendTokens(): Promise<JupiterPool[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.baseUrl}/earn/tokens`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: JupiterPool[] = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching Jupiter lend tokens:', error)
      throw new Error('Failed to fetch Jupiter data')
    }
  }

  parseToAggregatorData(pools: JupiterPool[]): AggregatorData[] {
    return pools.map(pool => ({
      token: {
        symbol: pool.asset.symbol,
        address: pool.asset.address,
        decimals: pool.asset.decimals,
        logo: pool.asset.logoUrl,
        price: parseFloat(pool.asset.price),
      },
      apy: this.calculateAPY(pool.totalRate),
      tvl: this.calculateTVL(pool.totalAssets, pool.asset.decimals, pool.asset.price),
      protocol: 'Jupiter',
      category: 'lending' as const,
      isActive: pool.liquiditySupplyData.modeWithInterest,
      lastUpdated: new Date().toISOString(),
    }))
  }

  private calculateAPY(totalRate: string): number {
    // Convert from basis points to percentage
    return (parseFloat(totalRate) / 10000) * 100
  }

  private calculateTVL(totalAssets: string, decimals: number, price: string): number {
    // Convert from smallest units to token amount, then multiply by price
    const tokenAmount = parseFloat(totalAssets) / Math.pow(10, decimals)
    const tokenPrice = parseFloat(price)
    return tokenAmount * tokenPrice
  }

  // ProtocolService interface implementation
  async getPools(): Promise<AggregatorData[]> {
    try {
      const pools = await this.getLendTokens()
      const aggregatorData = this.parseToAggregatorData(pools)
      
      // Sort by APY descending
      return aggregatorData.sort((a, b) => b.apy - a.apy)
    } catch (error) {
      console.error('Error getting aggregator data:', error)
      throw error
    }
  }

  async getUserPositions(walletAddress: string): Promise<UserPosition[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.baseUrl}/earn/positions?users=${walletAddress}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: JupiterUserPosition[] = await response.json()
      return this.parseUserPositions(data)
    } catch (error) {
      console.error('Error fetching Jupiter user positions:', error)
      throw new Error('Failed to fetch Jupiter user positions')
    }
  }

  async supply(tokenAddress: string, amount: string, walletAddress: string): Promise<ProtocolTransaction> {
    // TODO: Implement Jupiter supply transaction
    throw new Error('Supply functionality not implemented yet')
  }

  async withdraw(positionId: string, amount: string, walletAddress: string): Promise<ProtocolTransaction> {
    // TODO: Implement Jupiter withdraw transaction
    throw new Error('Withdraw functionality not implemented yet')
  }

  async claimRewards(positionId: string, walletAddress: string): Promise<ProtocolTransaction> {
    // TODO: Implement Jupiter claim rewards transaction
    throw new Error('Claim rewards functionality not implemented yet')
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/earn/tokens`, {
        method: 'HEAD',
        headers: {
          'Accept': 'application/json',
        },
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  // Helper methods
  private parseUserPositions(positions: JupiterUserPosition[]): UserPosition[] {
    return positions
      .filter(position => {
        // Only include positions with actual balance
        const shares = parseFloat(position.shares)
        const underlyingAssets = parseFloat(position.underlyingAssets)
        return shares > 0 || underlyingAssets > 0
      })
      .map(position => {
        const apy = this.calculateAPY(position.token.totalRate)
        const totalValue = this.calculateTotalValue(position)
        const withdrawable = this.calculateWithdrawable(position)

        return {
          id: `${this.name}-${position.token.address}`,
          protocol: this.name,
          tokenAddress: position.token.assetAddress,
          tokenSymbol: position.token.asset.symbol,
          tokenName: position.token.asset.name,
          tokenLogo: position.token.asset.logoUrl,
          shares: position.shares,
          underlyingAssets: position.underlyingAssets,
          underlyingBalance: position.underlyingBalance,
          apy,
          totalValue,
          withdrawable,
          lastUpdated: new Date().toISOString(),
        }
      })
  }

  private calculateTotalValue(position: JupiterUserPosition): number {
    const underlyingAssets = parseFloat(position.underlyingAssets)
    const tokenPrice = parseFloat(position.token.asset.price)
    const decimals = position.token.asset.decimals
    
    // Convert from smallest units to token amount, then multiply by price
    const tokenAmount = underlyingAssets / Math.pow(10, decimals)
    return tokenAmount * tokenPrice
  }

  private calculateWithdrawable(position: JupiterUserPosition): string {
    // Use the withdrawable amount from liquidity data if available
    const liquidityData = position.token.liquiditySupplyData
    if (liquidityData && liquidityData.withdrawable) {
      return liquidityData.withdrawable
    }
    
    // Fallback to underlying balance
    return position.underlyingBalance || '0'
  }

  // Legacy method for backward compatibility
  async getAggregatorData(): Promise<AggregatorData[]> {
    return this.getPools()
  }
}

// Export singleton instance
export const jupiterService = new JupiterService()
