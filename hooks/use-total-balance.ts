import { useState, useEffect, useMemo } from 'react'
import { useWalletContext } from '@/contexts/wallet-context'
import { useLendPositions } from './use-lend-positions'

interface UseTotalBalanceReturn {
  totalBalance: number
  isLoading: boolean
  error: string | null
}

export function useTotalBalance(walletAddress: string | undefined): UseTotalBalanceReturn {
  const { balance } = useWalletContext()
  const { positions, isLoading: isPositionsLoading, error: positionsError } = useLendPositions(walletAddress)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Рассчитываем общую сумму
  const totalBalance = useMemo(() => {
    let total = 0

    // Добавляем стоимость токенов в кошельке
    if (balance.totalUsdValue !== undefined) {
      total += balance.totalUsdValue
    }

    // Добавляем стоимость позиций в Jupiter
    const positionsValue = positions.reduce((sum, position) => {
      return sum + position.totalValue
    }, 0)
    
    total += positionsValue

    return total
  }, [balance.totalUsdValue, positions])

  // Обновляем состояние загрузки
  useEffect(() => {
    setIsLoading(balance.isLoading || isPositionsLoading)
  }, [balance.isLoading, isPositionsLoading])

  // Обновляем состояние ошибки
  useEffect(() => {
    setError(balance.error || positionsError)
  }, [balance.error, positionsError])

  return {
    totalBalance,
    isLoading,
    error,
  }
}
