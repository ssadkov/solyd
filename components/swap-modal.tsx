'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowUpDown, AlertCircle, CheckCircle, Wallet, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWalletContext } from '@/contexts/wallet-context'
import { useSwap } from '@/hooks/use-swap'
import { useEnhancedOpportunities } from '@/hooks/use-enhanced-opportunities'
import { TokenSelector } from '@/components/token-selector'

interface SwapModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TokenOption {
  symbol: string
  address: string
  decimals: number
  logo: string
  price: number
  balance: number
  usdValue: number
  apy?: number
}

export function SwapModal({ isOpen, onClose }: SwapModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedTokenIn, setSelectedTokenIn] = useState<TokenOption | null>(null)
  const [selectedTokenOut, setSelectedTokenOut] = useState<TokenOption | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { balance, walletAddress } = useWalletContext()
  const { opportunities } = useEnhancedOpportunities(walletAddress)
  const { quote, isLoading, error, getQuote, clearQuote } = useSwap()

  // Создаем список токенов in из баланса кошелька
  const tokenInOptions: TokenOption[] = useMemo(() => {
    const walletTokens = [
      {
        symbol: 'SOL',
        address: 'So11111111111111111111111111111111111111112', // SOL mint address
        decimals: 9,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        price: 100, // Заглушка, нужно получать реальную цену
        balance: balance.sol,
        usdValue: balance.sol * 100, // Заглушка, нужно получать реальную цену
      },
      ...balance.tokens.map(token => ({
        symbol: token.symbol || 'Unknown',
        address: token.mint,
        decimals: token.decimals,
        logo: token.logo || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        price: 1, // Заглушка
        balance: token.uiAmount,
        usdValue: token.uiAmount * 1, // Заглушка
      }))
    ]

    // Добавляем популярные токены, даже если их нет в кошельке
    const popularTokens = [
      {
        symbol: 'USDC',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        price: 1,
        balance: 0,
        usdValue: 0,
      },
      {
        symbol: 'USDT',
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        decimals: 6,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
        price: 1,
        balance: 0,
        usdValue: 0,
      }
    ]

    // Объединяем токены из кошелька и популярные токены
    const allTokens = [...walletTokens, ...popularTokens]
    
    // Убираем дубликаты по адресу
    const uniqueTokens = allTokens.filter((token, index, self) => 
      index === self.findIndex(t => t.address === token.address)
    )

    return uniqueTokens.filter(token => token.balance > 0)
  }, [balance.sol, balance.tokens])

  // Создаем список токенов out из opportunities
  const tokenOutOptions: TokenOption[] = useMemo(() => {
    const opportunityTokens = opportunities.map(opp => ({
      symbol: opp.token.symbol,
      address: opp.token.address,
      decimals: opp.token.decimals,
      logo: opp.token.logo,
      price: opp.token.price,
      balance: 0, // Не важно для токена out
      usdValue: 0, // Не важно для токена out
      apy: opp.apy,
    }))

    // Добавляем популярные токены для выбора
    const popularOutTokens = [
      {
        symbol: 'SOL',
        address: 'So11111111111111111111111111111111111111112',
        decimals: 9,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        price: 100,
        balance: 0,
        usdValue: 0,
        apy: 0,
      },
      {
        symbol: 'USDC',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        price: 1,
        balance: 0,
        usdValue: 0,
        apy: 0,
      }
    ]

    // Объединяем и убираем дубликаты
    const allOutTokens = [...opportunityTokens, ...popularOutTokens]
    return allOutTokens.filter((token, index, self) => 
      index === self.findIndex(t => t.address === token.address)
    )
  }, [opportunities])

  // Устанавливаем токены по умолчанию при открытии модального окна
  useEffect(() => {
    if (isOpen && tokenInOptions.length > 0 && tokenOutOptions.length > 0 && !selectedTokenIn && !selectedTokenOut) {
      // Токен in с наибольшим USD значением
      const bestTokenIn = tokenInOptions.reduce((best, current) => 
        current.usdValue > best.usdValue ? current : best
      )
      setSelectedTokenIn(bestTokenIn)

      // Токен out с наибольшим APY
      const bestTokenOut = tokenOutOptions.reduce((best, current) => 
        (current.apy || 0) > (best.apy || 0) ? current : best
      )
      setSelectedTokenOut(bestTokenOut)
    }
  }, [isOpen, tokenInOptions, tokenOutOptions, selectedTokenIn, selectedTokenOut])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !selectedTokenIn || !selectedTokenOut) return

    setIsSubmitting(true)
    try {
      // Конвертируем сумму в минимальные единицы токена
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, selectedTokenIn.decimals))
      
      await getQuote({
        inputMint: selectedTokenIn.address,
        outputMint: selectedTokenOut.address,
        amount: amountInSmallestUnit.toString(),
        slippageBps: 100, // 1% slippage
      })
    } catch (err) {
      console.error('Quote failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    setSelectedTokenIn(null)
    setSelectedTokenOut(null)
    clearQuote()
    onClose()
  }

  const handleMax = () => {
    if (selectedTokenIn) {
      setAmount(selectedTokenIn.balance.toString())
    }
  }

  const handleSwapTokens = () => {
    const temp = selectedTokenIn
    setSelectedTokenIn(selectedTokenOut)
    setSelectedTokenOut(temp)
    clearQuote()
  }

  const formatTokenAmount = (amount: number, decimals: number) => {
    return (amount / Math.pow(10, decimals)).toFixed(6)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Swap Tokens
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Swap Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token In */}
            <div className="space-y-2">
              <TokenSelector
                label="From"
                selectedToken={selectedTokenIn}
                onTokenSelect={setSelectedTokenIn}
                tokens={tokenInOptions}
                placeholder="Select token to swap from"
                disabled={isLoading || isSubmitting}
                showBalance={true}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isLoading || isSubmitting}
                    className="text-lg"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMax}
                  disabled={isLoading || isSubmitting || !selectedTokenIn}
                  className="px-3"
                >
                  Max
                </Button>
              </div>
              {selectedTokenIn && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Balance: {selectedTokenIn.balance.toFixed(6)} {selectedTokenIn.symbol}</span>
                  <span>≈ ${selectedTokenIn.usdValue.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSwapTokens}
                disabled={!selectedTokenIn || !selectedTokenOut}
                className="rounded-full"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>

            {/* Token Out */}
            <div className="space-y-2">
              <TokenSelector
                label="To"
                selectedToken={selectedTokenOut}
                onTokenSelect={setSelectedTokenOut}
                tokens={tokenOutOptions}
                placeholder="Select token to swap to"
                disabled={isLoading || isSubmitting}
                showApy={true}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={quote ? formatTokenAmount(parseInt(quote.outAmount), selectedTokenOut?.decimals || 9) : ''}
                    disabled
                    className="text-lg bg-muted"
                    placeholder="0.00"
                  />
                </div>
                <div className="px-3 py-2 border rounded-md bg-muted text-sm">
                  Expected output
                </div>
              </div>
              {selectedTokenOut && selectedTokenOut.apy && (
                <div className="flex items-center justify-end text-sm text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {selectedTokenOut.apy.toFixed(2)}% APY
                </div>
              )}
            </div>

            {/* Quote Info */}
            {quote && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">Quote Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Impact:</span>
                    <span>{parseFloat(quote.priceImpactPct).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slippage:</span>
                    <span>{quote.slippageBps / 100}%</span>
                  </div>
                  {quote.routePlan.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route:</span>
                      <span>{quote.routePlan[0].swapInfo.label}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                disabled={
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  !selectedTokenIn || 
                  !selectedTokenOut ||
                  isLoading || 
                  isSubmitting
                }
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Quote...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Get Quote
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Quote provided by Jupiter API</p>
            <p>Actual output may vary due to market conditions</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
