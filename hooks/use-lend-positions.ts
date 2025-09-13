import { useState, useEffect, useCallback } from 'react'
import { UserPosition } from '@/types/protocol'

interface UseLendPositionsReturn {
  positions: UserPosition[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  totalValue: number
  activePositions: number
}

export function useLendPositions(walletAddress: string | undefined): UseLendPositionsReturn {
  const [positions, setPositions] = useState<UserPosition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPositions = useCallback(async () => {
    if (!walletAddress) {
      setPositions([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/user-positions?address=${walletAddress}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch positions')
      }

      if (data.success && data.data) {
        setPositions(data.data)
      } else {
        throw new Error(data.error || 'Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching lend positions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setPositions([])
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  // Автоматическая загрузка при изменении адреса кошелька
  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  // Вычисляемые значения
  const totalValue = positions.reduce((sum, position) => sum + position.totalValue, 0)
  const activePositions = positions.filter(position => position.totalValue > 0).length

  return {
    positions,
    isLoading,
    error,
    refetch: fetchPositions,
    totalValue,
    activePositions,
  }
}
