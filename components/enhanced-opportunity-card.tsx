'use client'

import { useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { TrendingUp, Plus, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DepositModal } from './deposit-modal'
import { WithdrawModal } from './withdraw-modal'
import { SuccessMessage } from './success-message'
import { useDeposit } from '@/hooks/use-deposit'

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

interface EnhancedOpportunityCardProps {
  opportunity: EnhancedOpportunity
  onAddMore?: (opportunity: EnhancedOpportunity) => void
  onWithdraw?: (opportunity: EnhancedOpportunity) => void
  onStartEarning?: (opportunity: EnhancedOpportunity) => void
}

export function EnhancedOpportunityCard({ 
  opportunity, 
  onAddMore, 
  onWithdraw, 
  onStartEarning 
}: EnhancedOpportunityCardProps) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [lastDepositAmount, setLastDepositAmount] = useState('')
  
  const { deposit, isLoading, error } = useDeposit()
  const { userPosition } = opportunity
  const hasPosition = userPosition?.hasPosition || false

  const handleDeposit = async (amount: string) => {
    try {
      // Convert amount to lamports (assuming 6 decimals for most tokens)
      const decimals = opportunity.token.decimals || 6
      const amountInLamports = Math.floor(parseFloat(amount) * Math.pow(10, decimals)).toString()
      
      // Execute deposit
      const signature = await deposit(opportunity.token.address, amountInLamports)
      
      console.log('Deposit successful:', signature)
      
      // Store deposit amount and show success message
      setLastDepositAmount(amount)
      setIsDepositModalOpen(false)
      setIsSuccessModalOpen(true)
    } catch (err) {
      console.error('Deposit failed:', err)
      // Error is handled by the useDeposit hook
    }
  }

  const handleAddMore = () => {
    setIsDepositModalOpen(true)
  }

  const handleStartEarning = () => {
    setIsDepositModalOpen(true)
  }

  const handleWithdraw = async (amount: string) => {
    try {
      // TODO: Implement withdraw logic
      console.log('Withdrawing:', amount, 'from', opportunity.token.symbol)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Store withdraw amount and show success message
      setLastDepositAmount(`-${amount}`) // Negative to indicate withdrawal
      setIsWithdrawModalOpen(false)
      setIsSuccessModalOpen(true)
    } catch (err) {
      console.error('Withdraw failed:', err)
      // Error is handled by the useWithdraw hook
    }
  }

  const handleWithdrawClick = () => {
    setIsWithdrawModalOpen(true)
  }

  return (
    <Card 
      className={`relative transition-all duration-200 hover:shadow-lg ${
        hasPosition 
          ? 'ring-2 ring-green-500/50 border-green-500/30' 
          : 'hover:shadow-md'
      }`}
    >
      {/* Earning Badge */}
      {hasPosition && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge 
            variant="default" 
            className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Earning
          </Badge>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
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
              <h3 className="text-lg font-semibold">{opportunity.token.symbol}</h3>
              <p className="text-sm text-muted-foreground">{opportunity.protocol}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-500">
              {opportunity.apy.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">APY</div>
          </div>
        </div>

        {/* User Position Info */}
        {hasPosition && userPosition && (
          <div className="mb-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700 dark:text-green-300 font-medium">
                Your Investment
              </span>
              <span className="text-green-700 dark:text-green-300 font-bold">
                {formatCurrency(userPosition.investedAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">TVL: </span>
            <span className="font-medium">
              {formatCurrency(opportunity.tvl / 1000000)}M
            </span>
          </div>
          <div className="text-sm">
            <span className={`px-2 py-1 rounded-full text-xs ${
              opportunity.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {opportunity.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!opportunity.isActive ? (
            <Button 
              className="w-full" 
              disabled
              variant="outline"
            >
              Coming Soon
            </Button>
          ) : hasPosition ? (
            <>
              <Button 
                className="flex-1" 
                onClick={handleAddMore}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add More
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleWithdrawClick}
                variant="outline"
                size="sm"
              >
                <Minus className="w-4 h-4 mr-1" />
                Withdraw
              </Button>
            </>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleStartEarning}
            >
              Start Earning
            </Button>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        opportunity={opportunity}
        onDeposit={handleDeposit}
        isLoading={isLoading}
        error={error}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        opportunity={opportunity}
        onWithdraw={handleWithdraw}
        isLoading={isLoading}
        error={error}
      />

      {/* Success Message */}
      <SuccessMessage
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        amount={lastDepositAmount}
        tokenSymbol={opportunity.token.symbol}
        apy={opportunity.apy}
        isFirstDeposit={!hasPosition}
      />
    </Card>
  )
}
