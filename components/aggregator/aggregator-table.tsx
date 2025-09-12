'use client'

import { AggregatorData } from '@/types/aggregator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { TrendingUp, ExternalLink } from 'lucide-react'

interface AggregatorTableProps {
  data: AggregatorData[]
  isLoading?: boolean
}

export function AggregatorTable({ data, isLoading }: AggregatorTableProps) {
  // Debug: log first item's logo URL
  if (data.length > 0) {
    console.log('First token logo URL:', data[0].token.logo)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading aggregator data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No data available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unable to load aggregator data. Please try again later.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          DeFi Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">APY</TableHead>
                <TableHead className="text-right">TVL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {item.token.logo ? (
                          <img 
                            src={item.token.logo} 
                            alt={item.token.symbol}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <span className={`${item.token.logo ? 'hidden' : ''} text-muted-foreground`}>
                          {item.token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{item.token.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.token.address.slice(0, 8)}...{item.token.address.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.protocol}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-bold text-green-600">
                      {item.apy.toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">
                      ${(item.tvl / 1000000).toFixed(1)}M
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.isActive ? "default" : "secondary"}
                      className={item.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      disabled={!item.isActive}
                      className="h-8"
                    >
                      {item.isActive ? "Deposit" : "Soon"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
