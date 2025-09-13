'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface EnhancedOpportunity {
  token: {
    symbol: string
    address: string
    decimals: number
    logo: string
    price: number
  }
  apy: number
  tvl: number
  protocol: string
  category: 'lending' | 'rewards' | 'liquidity' | 'staking'
  isActive: boolean
  lastUpdated: string
  userPosition?: {
    hasPosition: boolean
    investedAmount: number
    positionId: string
  }
}

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity: EnhancedOpportunity | null
  onDeposit: (amount: string) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function DepositModal({ 
  isOpen, 
  onClose, 
  opportunity, 
  onDeposit, 
  isLoading = false,
  error = null
}: DepositModalProps) {
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!opportunity) return null

  const { userPosition } = opportunity
  const hasPosition = userPosition?.hasPosition || false
  const isFirstDeposit = !hasPosition

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return

    setIsSubmitting(true)
    try {
      await onDeposit(amount)
      setAmount('')
    } catch (err) {
      console.error('Deposit failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {opportunity.token.logo && (
              <img 
                src={opportunity.token.logo} 
                alt={opportunity.token.symbol}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            {isFirstDeposit ? 'Deposit to' : 'Add More to'} {opportunity.token.symbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Token Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {opportunity.token.logo && (
                  <img 
                    src={opportunity.token.logo} 
                    alt={opportunity.token.symbol}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div>
                  <h3 className="font-semibold">{opportunity.token.symbol}</h3>
                  <p className="text-sm text-muted-foreground">{opportunity.protocol}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-500 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {opportunity.apy.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground">APY</div>
              </div>
            </div>

            {/* Current Position */}
            {hasPosition && userPosition && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Investment</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(userPosition.investedAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Deposit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ({opportunity.token.symbol})
              </Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading || isSubmitting}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Enter the amount you want to deposit
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading || isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!amount || parseFloat(amount) <= 0 || isLoading || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isFirstDeposit ? 'Start Earning' : 'Add More'}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Your deposit will start earning {opportunity.apy.toFixed(2)}% APY immediately</p>
            {hasPosition && (
              <p className="mt-1">Additional funds will be added to your existing position</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
