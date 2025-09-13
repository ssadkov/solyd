'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CheckCircle, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SuccessMessageProps {
  isOpen: boolean
  onClose: () => void
  amount: string
  tokenSymbol: string
  apy: number
  isFirstDeposit: boolean
}

export function SuccessMessage({ 
  isOpen, 
  onClose, 
  amount, 
  tokenSymbol, 
  apy,
  isFirstDeposit 
}: SuccessMessageProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          {/* Main Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-600">
              {isFirstDeposit ? 'Deposit Successful!' : 'Added to Position!'}
            </h2>
            <p className="text-lg text-muted-foreground">
              <span className="font-semibold text-foreground">{amount} {tokenSymbol}</span>
              {isFirstDeposit ? ' deposited successfully' : ' added to your position'}
            </p>
          </div>

          {/* Earning Message */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-700 dark:text-green-300">
                You're now earning!
              </span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              Your funds are earning <span className="font-bold">{apy.toFixed(2)}% APY</span>
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
