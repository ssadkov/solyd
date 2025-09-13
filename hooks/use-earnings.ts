import { useState, useEffect, useCallback } from 'react'
import { JupiterEarningsExtended } from '@/types/jupiter'
import { UserPosition } from '@/types/protocol'

interface UseEarningsReturn {
  earnings: JupiterEarningsExtended[]
  totalEarningsUSD: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useEarnings(
  walletAddress: string | undefined, 
  positionAddresses: string[],
  positions: UserPosition[] = []
): UseEarningsReturn {
  const [earnings, setEarnings] = useState<JupiterEarningsExtended[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEarnings = useCallback(async (currentPositions: UserPosition[] = []) => {
    if (!walletAddress || positionAddresses.length === 0) {
      setEarnings([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const positionsParam = positionAddresses.join(',')
      const response = await fetch(`/api/jupiter/earnings?address=${walletAddress}&positions=${positionsParam}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch earnings')
      }

      if (data.success && data.data) {
        // Обновляем earnings с правильными USD значениями
        const updatedEarnings = data.data.map((earning: JupiterEarningsExtended) => {
          // Находим соответствующую позицию для получения информации о токене
          const position = currentPositions.find(pos => pos.jupiterTokenAddress === earning.address)
          
          if (position) {
            // Рассчитываем USD значение earnings
            const earningsAmount = parseFloat(earning.earnings)
            const tokenPrice = parseFloat(position.tokenSymbol === 'USDC' ? '1.0' : '1.0') // Пока используем 1.0, нужно получить реальную цену
            const tokenDecimals = 6 // Пока используем 6, нужно получить из позиции
            
            const earningsValueUSD = (earningsAmount / Math.pow(10, tokenDecimals)) * tokenPrice
            
            return {
              ...earning,
              earningsValueUSD,
              tokenSymbol: position.tokenSymbol,
              tokenDecimals,
              tokenPrice: tokenPrice.toString(),
            }
          }
          
          return earning
        })
        
        setEarnings(updatedEarnings)
      } else {
        throw new Error(data.error || 'Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching earnings:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setEarnings([])
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress, positionAddresses])

  // Загружаем earnings только один раз при изменении walletAddress или positionAddresses
  useEffect(() => {
    if (walletAddress && positionAddresses.length > 0) {
      fetchEarnings(positions)
    }
  }, [walletAddress, positionAddresses.join(','), fetchEarnings]) // Используем join для стабильной зависимости

  // Вычисляем общую сумму earnings в USD
  const totalEarningsUSD = earnings.reduce((sum, earning) => {
    // Пока что возвращаем 0, так как USD расчет будет в компоненте
    // где у нас есть доступ к информации о токенах
    return sum + earning.earningsValueUSD
  }, 0)

  return {
    earnings,
    totalEarningsUSD,
    isLoading,
    error,
    refetch: () => fetchEarnings(positions),
  }
}
