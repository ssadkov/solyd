import { JupiterPool } from '@/types/jupiter'
import { AggregatorData } from '@/types/aggregator'

export class JupiterService {
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

  async getAggregatorData(): Promise<AggregatorData[]> {
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
}

// Export singleton instance
export const jupiterService = new JupiterService()
