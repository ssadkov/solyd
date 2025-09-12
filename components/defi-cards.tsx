import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AggregatorData } from "@/types/aggregator"

interface DefiCardsProps {
  data?: AggregatorData[]
  isLoading?: boolean
}

export function DefiCards({ data = [], isLoading = false }: DefiCardsProps) {
  // Calculate stats from real data
  const stats = {
    totalTVL: data.reduce((sum, item) => sum + item.tvl, 0),
    activePools: data.filter(item => item.isActive).length,
    totalEarned: 0, // This would come from user's actual earnings
    bestAPY: data.length > 0 ? Math.max(...data.map(item => item.apy)) : 0,
  }
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Value Locked</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? '...' : `$${(stats.totalTVL / 1000000).toFixed(1)}M`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <IconTrendingUp />
              {isLoading ? '...' : '+0%'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading ? 'Loading...' : stats.activePools > 0 ? `${stats.activePools} active pools` : 'No active positions'} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {isLoading ? 'Fetching data...' : 'Connect wallet to start earning'}
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Positions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? '...' : stats.activePools}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-muted-foreground">
              <IconTrendingDown />
              {isLoading ? '...' : '-0%'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading ? 'Loading...' : stats.activePools > 0 ? 'Active pools available' : 'No active positions'} <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {isLoading ? 'Fetching data...' : 'Start with liquidity mining'}
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Earned</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? '...' : '$0.00'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <IconTrendingUp />
              {isLoading ? '...' : '+0%'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading ? 'Loading...' : 'Lifetime earnings'} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{isLoading ? 'Fetching data...' : 'Start earning today'}</div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Best APY Available</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? '...' : `${stats.bestAPY.toFixed(2)}%`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <IconTrendingUp />
              {isLoading ? '...' : `+${stats.bestAPY.toFixed(2)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading ? 'Loading...' : 'Jupiter Lending'} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{isLoading ? 'Fetching data...' : 'High yield opportunities'}</div>
        </CardFooter>
      </Card>
    </div>
  )
}
