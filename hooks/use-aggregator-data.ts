'use client'

import { useState, useEffect } from 'react'
import { AggregatorData } from '@/types/aggregator'

export function useAggregatorData() {
  const [data, setData] = useState<AggregatorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/aggregator')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch data')
      }
      
      setData(result.data)
    } catch (err) {
      console.error('Error fetching aggregator data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}
