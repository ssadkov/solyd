'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingDown, AlertCircle, Minus } from 'lucide-react'
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

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity: EnhancedOpportunity | null
  onWithdraw: (amount: string) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function WithdrawModal({ 
  isOpen, 
  onClose, 
  opportunity, 
  onWithdraw, 
  isLoading = false,
  error = null
}: WithdrawModalProps) {
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!opportunity || !opportunity.userPosition) return null

  const { userPosition } = opportunity
  const availableAmount = userPosition.investedAmount // В реальности здесь будет withdrawable amount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return

    setIsSubmitting(true)
    try {
      await onWithdraw(amount)
      setAmount('')
    } catch (err) {
      console.error('Withdraw failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    onClose()
  }

  const handleMax = () => {
    setAmount(availableAmount.toString())
  }

  const isAmountValid = amount && parseFloat(amount) > 0 && parseFloat(amount) <= availableAmount

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
            Withdraw from {opportunity.token.symbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Position Info */}
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
                  <TrendingDown className="w-4 h-4" />
                  {opportunity.apy.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground">APY</div>
              </div>
            </div>

            {/* Available Amount */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available to Withdraw</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(availableAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Withdraw Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ({opportunity.token.symbol})
              </Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  min="0"
                  max={availableAmount}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading || isSubmitting}
                  className="text-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMax}
                  disabled={isLoading || isSubmitting}
                  className="px-3"
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the amount you want to withdraw (max: {formatCurrency(availableAmount)})
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
                disabled={!isAmountValid || isLoading || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 mr-2" />
                    Withdraw
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Withdrawing will reduce your earning potential</p>
            <p className="mt-1">You'll stop earning APY on the withdrawn amount</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
