'use client'

import { AggregatorData } from '@/types/aggregator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Activity, Zap } from 'lucide-react'

interface AggregatorStatsProps {
  data: AggregatorData[]
}

export function AggregatorStats({ data }: AggregatorStatsProps) {
  const stats = {
    totalProtocols: new Set(data.map(item => item.protocol)).size,
    totalTVL: data.reduce((sum, item) => sum + item.tvl, 0),
    averageAPY: data.length > 0 ? data.reduce((sum, item) => sum + item.apy, 0) / data.length : 0,
    activePools: data.filter(item => item.isActive).length,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Protocols</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProtocols}</div>
          <p className="text-xs text-muted-foreground">
            Active protocols
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total TVL</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(stats.totalTVL / 1000000).toFixed(1)}M
          </div>
          <p className="text-xs text-muted-foreground">
            Value locked
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average APY</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.averageAPY.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Mean yield
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Pools</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activePools}</div>
          <p className="text-xs text-muted-foreground">
            Available for deposit
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
