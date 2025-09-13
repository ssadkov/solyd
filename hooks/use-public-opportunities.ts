'use client'

import { useState, useEffect, useCallback } from 'react'
import { AggregatorData } from '@/types/aggregator'

interface PublicOpportunity extends AggregatorData {
  // Публичные возможности не имеют пользовательских позиций
  userPosition?: undefined
}

interface UsePublicOpportunitiesReturn {
  opportunities: PublicOpportunity[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function usePublicOpportunities(): UsePublicOpportunitiesReturn {
  const [opportunities, setOpportunities] = useState<PublicOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Загружаем только публичные данные из агрегатора
      const response = await fetch('/api/aggregator')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch data')
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      const pools: AggregatorData[] = result.data

      // Преобразуем в публичные возможности (без пользовательских позиций)
      const publicOpportunities: PublicOpportunity[] = pools.map(pool => {
        
        return {
          ...pool,
          userPosition: undefined
        }
      })

      setOpportunities(publicOpportunities)
    } catch (err) {
      console.error('Error fetching public opportunities:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setOpportunities([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Автоматическая загрузка при монтировании компонента
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    opportunities,
    isLoading,
    error,
    refetch: fetchData,
  }
}
