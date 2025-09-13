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
  const isWithdraw = amount.startsWith('-')
  const displayAmount = isWithdraw ? amount.substring(1) : amount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          {/* Success Icon */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isWithdraw 
              ? 'bg-blue-100 dark:bg-blue-900/30' 
              : 'bg-green-100 dark:bg-green-900/30'
          }`}>
            <CheckCircle className={`w-10 h-10 ${
              isWithdraw ? 'text-blue-500' : 'text-green-500'
            }`} />
          </div>

          {/* Main Message */}
          <div className="space-y-2">
            <h2 className={`text-2xl font-bold ${
              isWithdraw ? 'text-blue-600' : 'text-green-600'
            }`}>
              {isWithdraw 
                ? 'Withdraw Successful!' 
                : isFirstDeposit 
                  ? 'Deposit Successful!' 
                  : 'Added to Position!'
              }
            </h2>
            <p className="text-lg text-muted-foreground">
              <span className="font-semibold text-foreground">{displayAmount} {tokenSymbol}</span>
              {isWithdraw 
                ? ' withdrawn successfully' 
                : isFirstDeposit 
                  ? ' deposited successfully' 
                  : ' added to your position'
              }
            </p>
          </div>

          {/* Earning Message */}
          {!isWithdraw && (
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
          )}

          {isWithdraw && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 w-full">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  Funds withdrawn
                </span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Your remaining position continues earning <span className="font-bold">{apy.toFixed(2)}% APY</span>
              </p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${
              isWithdraw 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
