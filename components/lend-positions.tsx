'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { Alert, AlertDescription } from './ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react'
import { useLendPositions } from '@/hooks/use-lend-positions'
import { UserPosition } from '@/types/protocol'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface LendPositionsProps {
  walletAddress: string | undefined
}

export function LendPositions({ walletAddress }: LendPositionsProps) {
  const { positions, isLoading, error, refetch, totalValue, activePositions } = useLendPositions(walletAddress)

  if (!walletAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lending Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Connect your wallet to view lending positions
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lending Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load lending positions: {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lending Positions
          </CardTitle>
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Active Positions</p>
            <p className="text-sm">You don't have any active lending positions yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active Positions</p>
                <p className="text-2xl font-bold">{activePositions}</p>
              </div>
            </div>

            {/* Positions List */}
            <div className="space-y-4">
              {positions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PositionCard({ position }: { position: UserPosition }) {
  const underlyingAmount = parseFloat(position.underlyingAssets) / Math.pow(10, 6) // Assuming 6 decimals for most tokens
  
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {position.tokenLogo && (
            <img 
              src={position.tokenLogo} 
              alt={position.tokenSymbol}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div>
            <p className="font-medium">{position.tokenSymbol}</p>
            <p className="text-sm text-muted-foreground">{position.tokenName}</p>
          </div>
        </div>
        <Badge variant="secondary">{position.protocol}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">APY</p>
          <p className="font-medium text-green-600">{position.apy.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Balance</p>
          <p className="font-medium">{formatNumber(underlyingAmount)} {position.tokenSymbol}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Value</p>
          <p className="font-medium">{formatCurrency(position.totalValue)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          Supply More
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <Minus className="h-4 w-4 mr-2" />
          Withdraw
        </Button>
        <Button size="sm" variant="outline">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
