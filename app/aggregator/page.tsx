'use client'

import { useState, useEffect } from 'react'
import { AggregatorData } from '@/types/aggregator'
import { AggregatorStats } from '@/components/aggregator/aggregator-stats'
import { AggregatorTable } from '@/components/aggregator/aggregator-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, AlertCircle } from 'lucide-react'

export default function AggregatorPage() {
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
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription>
              Unable to load aggregator data from Jupiter API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
              <Button onClick={fetchData} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">DeFi Aggregator</h1>
        <p className="text-muted-foreground">
          Real-time data from Jupiter lending protocol
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Protocol Data</h2>
          <p className="text-sm text-muted-foreground">
            Live APY and TVL information
          </p>
        </div>
        <Button 
          onClick={fetchData} 
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <AggregatorStats data={data} />
      <AggregatorTable data={data} isLoading={isLoading} />
    </div>
  )
}
