import { useState, useEffect, useCallback } from 'react'
import { AggregatorData } from '@/types/aggregator'
import { UserPosition } from '@/types/protocol'
import { JupiterTokenService, JupiterTokenData } from '@/services/jupiter-token.service'

interface EnhancedOpportunity extends AggregatorData {
  userPosition?: {
    hasPosition: boolean
    investedAmount: number
    positionId: string
  }
}

interface UseEnhancedOpportunitiesReturn {
  opportunities: EnhancedOpportunity[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  totalInvested: number
  activePositions: number
}

export function useEnhancedOpportunities(walletAddress: string | undefined): UseEnhancedOpportunitiesReturn {
  const [opportunities, setOpportunities] = useState<EnhancedOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenData, setTokenData] = useState<JupiterTokenData[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Загружаем данные пулов всегда
      const poolsResponse = await fetch('/api/aggregator')
      const poolsData = await poolsResponse.json()

      if (!poolsData.success) {
        throw new Error('Failed to fetch pools data')
      }

      const pools: AggregatorData[] = poolsData.data

      // Загружаем позиции пользователя только если кошелек подключен
      let positions: UserPosition[] = []
      if (walletAddress) {
        try {
          const positionsResponse = await fetch(`/api/user-positions?address=${walletAddress}`)
          const positionsData = await positionsResponse.json()
          
          if (positionsData.success) {
            positions = positionsData.data
          }
        } catch (positionError) {
          console.warn('Failed to fetch user positions:', positionError)
          // Продолжаем без позиций пользователя
        }
      }

      // Загружаем данные о токенах через Jupiter API
      setIsLoadingTokens(true)
      let jupiterTokenData: JupiterTokenData[] = []
      try {
        const tokenAddresses = pools.map(pool => pool.token.address)
        jupiterTokenData = await JupiterTokenService.getTokens(tokenAddresses)
        setTokenData(jupiterTokenData)
      } catch (tokenError) {
        console.error('Failed to fetch token data:', tokenError)
        setTokenData([])
      } finally {
        setIsLoadingTokens(false)
      }

      // Объединяем данные с информацией о токенах
      const enhancedOpportunities: EnhancedOpportunity[] = pools.map(pool => {
        // Ищем соответствующую позицию пользователя
        const userPosition = positions.find(position => 
          position.tokenAddress.toLowerCase() === pool.token.address.toLowerCase()
        )

        // Получаем данные о токене от Jupiter API (используем свежие данные)
        const tokenInfo = jupiterTokenData.find((token: JupiterTokenData) => token.id === pool.token.address)

        return {
          ...pool,
          token: {
            ...pool.token,
            // Используем иконку от Jupiter API, если доступна, иначе fallback
            logo: tokenInfo?.icon || pool.token.logo || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
          },
          userPosition: userPosition ? {
            hasPosition: true,
            investedAmount: userPosition.totalValue,
            positionId: userPosition.id
          } : undefined
        }
      })

      setOpportunities(enhancedOpportunities)
    } catch (err) {
      console.error('Error fetching enhanced opportunities:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setOpportunities([])
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  // Автоматическая загрузка при монтировании и изменении адреса кошелька
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Дополнительная загрузка при изменении адреса кошелька (для обновления позиций)
  useEffect(() => {
    if (walletAddress) {
      fetchData()
    }
  }, [walletAddress, fetchData])

  // Вычисляемые значения
  const totalInvested = opportunities.reduce((sum, opp) => 
    sum + (opp.userPosition?.investedAmount || 0), 0
  )
  const activePositions = opportunities.filter(opp => opp.userPosition?.hasPosition).length

  return {
    opportunities,
    isLoading,
    error,
    refetch: fetchData,
    totalInvested,
    activePositions,
  }
}
