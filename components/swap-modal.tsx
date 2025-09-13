'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWalletContext } from '@/contexts/wallet-context'
import { useSwap } from '@/hooks/use-swap'
import { useDeposit } from '@/hooks/use-deposit'
import { useEnhancedOpportunities } from '@/hooks/use-enhanced-opportunities'
import { useWalletBalance } from '@/hooks/use-wallet-balance'
import { TokenSelector } from '@/components/token-selector'
import { JupiterTokenService, JupiterTokenData } from '@/services/jupiter-token.service'
import { JupiterPriceService } from '@/services/jupiter-price.service'

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
  balance?: number
  usdValue?: number
  apy?: number
}

export function SwapModal({ isOpen, onClose }: SwapModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedTokenIn, setSelectedTokenIn] = useState<TokenOption | null>(null)
  const [selectedTokenOut, setSelectedTokenOut] = useState<TokenOption | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [swapStep, setSwapStep] = useState<'quote' | 'confirm' | 'executing' | 'depositing' | 'success'>('quote')
  const [isSwapOnly, setIsSwapOnly] = useState(false)
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null)
  const [depositSignature, setDepositSignature] = useState<string | null>(null)
  const [tokenData, setTokenData] = useState<JupiterTokenData[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [depositAmount, setDepositAmount] = useState<string>('')
  const [solPrice, setSolPrice] = useState<number | null>(null)
  
  const { balance, walletAddress, refreshBalance } = useWalletContext()
  const { 
    solUsdPrice, 
    solUsdValue 
  } = useWalletBalance(walletAddress)
  const { opportunities } = useEnhancedOpportunities(walletAddress)
  const { quote, isLoading, error, getQuote, getSwapInstructions, executeSwap, clearQuote } = useSwap()
  const { deposit, isLoading: isDepositLoading, error: depositError } = useDeposit()

  // Получаем данные о токенах от Jupiter API (как в WalletAssets)
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!walletAddress) {
        setTokenData([])
        return
      }

      // Всегда загружаем данные, даже если нет токенов (для SOL)
      setIsLoadingTokens(true)
      try {
        const allMints = [
          'So11111111111111111111111111111111111111112', // SOL - всегда добавляем
          ...balance.tokens.map(token => token.mint)
        ]
        
        const data = await JupiterTokenService.getTokens(allMints)
        setTokenData(data)
      } catch (error) {
        console.error('Failed to fetch token data:', error)
        setTokenData([])
      } finally {
        setIsLoadingTokens(false)
      }
    }

    fetchTokenData()
  }, [walletAddress, balance.tokens])

  // Отдельно загружаем цену SOL если она не загрузилась через основной API
  useEffect(() => {
    const fetchSolPrice = async () => {
      if (balance.sol > 0 && !solPrice) {
        try {
          const priceData = await JupiterPriceService.getPrice('So11111111111111111111111111111111111111112');
          if (priceData) {
            setSolPrice(priceData.usdPrice);
          }
        } catch (error) {
          console.error('Failed to fetch SOL price:', error);
        }
      }
    };

    fetchSolPrice();
  }, [balance.sol, solPrice])

  // Функция для получения данных о токене
  const getTokenInfo = (mint: string): JupiterTokenData | null => {
    const tokenInfo = tokenData.find(token => token.id === mint);
    
    // Fallback для SOL если данные не загрузились
    if (mint === 'So11111111111111111111111111111111111111112' && !tokenInfo) {
      return {
        id: 'So11111111111111111111111111111111111111112',
        name: 'Solana',
        symbol: 'SOL',
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        decimals: 9,
        usdPrice: 0, // Будет загружено отдельно
        priceBlockId: 0,
        isVerified: true,
      };
    }
    
    return tokenInfo || null;
  }

  // Создаем список токенов in из баланса кошелька (как в WalletAssets)
  const tokenInOptions: TokenOption[] = useMemo(() => {
    // Если кошелек не подключен или данные не загружены, возвращаем пустой массив
    if (!walletAddress || balance.isLoading || isLoadingTokens) {
      return []
    }

    const allAssets = [
      // Add SOL only if balance > 0
      ...(balance.sol > 0 ? (() => {
        const solTokenInfo = getTokenInfo('So11111111111111111111111111111111111111112')
        const price = solTokenInfo?.usdPrice || solPrice || 0
        const usdValue = price > 0 ? balance.sol * price : 0
        return [{
          symbol: 'SOL',
          address: 'So11111111111111111111111111111111111111112',
          decimals: 9,
          logo: solTokenInfo?.icon || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
          price: price,
          balance: balance.sol || 0,
          usdValue: usdValue || 0,
        }]
      })() : []),
      // Add tokens
      ...balance.tokens.map(token => {
        const tokenInfo = getTokenInfo(token.mint)
        const usdValue = tokenInfo ? token.uiAmount * tokenInfo.usdPrice : 0
        return {
          symbol: tokenInfo?.symbol || token.symbol || 'Unknown',
          address: token.mint,
          decimals: token.decimals,
          logo: tokenInfo?.icon || token.logo || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
          price: tokenInfo?.usdPrice || 0,
          balance: token.uiAmount || 0,
          usdValue: usdValue || 0,
        }
      })
    ]

    // Фильтруем токены с балансом > 0 и с ценой > 0
    return allAssets.filter(token => 
      token.balance > 0 && 
      token.price > 0 &&
      token.symbol !== 'Unknown'
    ).sort((a, b) => b.usdValue - a.usdValue) // Сортируем по USD стоимости
  }, [walletAddress, balance.isLoading, balance.sol, balance.tokens, tokenData, isLoadingTokens, solPrice])

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
        price: solUsdPrice || 0,
        balance: balance.sol || 0,
        usdValue: solUsdValue || 0,
        apy: 0,
      },
      {
        symbol: 'USDC',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        price: 1, // USDC всегда $1
        balance: 0,
        usdValue: 0,
        apy: 0,
      }
    ]

    // Объединяем и убираем дубликаты
    const allOutTokens = [...opportunityTokens, ...popularOutTokens]
    
    // Фильтруем токены с ценой > 0
    return allOutTokens
      .filter((token, index, self) => 
        index === self.findIndex(t => t.address === token.address)
      )
      .filter(token => token.price > 0)
  }, [opportunities, solUsdPrice])

  // Устанавливаем токены по умолчанию при открытии модального окна
  useEffect(() => {
    if (isOpen && tokenInOptions.length > 0 && tokenOutOptions.length > 0 && !selectedTokenIn && !selectedTokenOut) {
      // Токен in с наибольшим USD значением
      const bestTokenIn = tokenInOptions.reduce((best, current) => 
        (current.usdValue || 0) > (best.usdValue || 0) ? current : best
      )
      setSelectedTokenIn(bestTokenIn)

      // Токен out с наибольшим APY
      const bestTokenOut = tokenOutOptions.reduce((best, current) => 
        (current.apy || 0) > (best.apy || 0) ? current : best
      )
      setSelectedTokenOut(bestTokenOut)
    }
  }, [isOpen, tokenInOptions, tokenOutOptions, selectedTokenIn, selectedTokenOut])

  // Сбрасываем состояния при изменении параметров
  useEffect(() => {
    if (swapStep !== 'quote') {
      setSwapStep('quote')
      clearQuote()
    }
  }, [selectedTokenIn, selectedTokenOut, amount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !selectedTokenIn || !selectedTokenOut) return

    if (swapStep === 'quote') {
      // Получаем quote
      setIsSubmitting(true)
      try {
        const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, selectedTokenIn.decimals))
        
        await getQuote({
          inputMint: selectedTokenIn.address,
          outputMint: selectedTokenOut.address,
          amount: amountInSmallestUnit.toString(),
          slippageBps: 100, // 1% slippage
        })
        
        setSwapStep('confirm')
      } catch (err) {
        console.error('Quote failed:', err)
      } finally {
        setIsSubmitting(false)
      }
    } else if (swapStep === 'confirm') {
      // Выполняем реальный swap
      setSwapStep('executing')
      setIsSubmitting(true)
      
      try {
        if (!quote || !walletAddress || !selectedTokenOut) {
          throw new Error('Missing quote, wallet address, or output token')
        }

        // Получаем swap instructions
        const instructions = await getSwapInstructions({
          quoteResponse: quote,
          userPublicKey: walletAddress,
          wrapAndUnwrapSol: true,
          useSharedAccounts: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto"
        })

        console.log('Received swap instructions:', instructions)

        // Проверяем структуру инструкций
        if (!instructions) {
          throw new Error('No instructions received from Jupiter API')
        }

        // Выполняем swap
        const signature = await executeSwap(instructions, walletAddress)
        
        // Обновляем баланс после успешного swap
        refreshBalance()
        
        setTransactionSignature(signature)
        
        // Используем количество из quote для deposit
        const humanAmount = (parseInt(quote.outAmount) / Math.pow(10, selectedTokenOut.decimals)).toString()
        setDepositAmount(humanAmount)
        
        console.log('Swap completed, starting deposit:', {
          token: selectedTokenOut.symbol,
          amount: humanAmount,
          rawAmount: quote.outAmount
        })
        
        // Переходим к этапу deposit
        setSwapStep('depositing')
        
        // Выполняем deposit
        const depositSig = await deposit(selectedTokenOut.address, quote.outAmount)
        setDepositSignature(depositSig)
        
        // Обновляем баланс после deposit
        refreshBalance()
        
        setSwapStep('success')
      } catch (err) {
        console.error('Swap or deposit failed:', err)
        setSwapStep('confirm')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleClose = () => {
    setAmount('')
    setSelectedTokenIn(null)
    setSelectedTokenOut(null)
    setSwapStep('quote')
    setTransactionSignature(null)
    setDepositSignature(null)
    setDepositAmount('')
    setIsSwapOnly(false)
    clearQuote()
    onClose()
  }

  const handleMax = () => {
    if (selectedTokenIn) {
      setAmount((selectedTokenIn.balance || 0).toString())
    }
  }


  const formatTokenAmount = (amount: number, decimals: number) => {
    return (amount / Math.pow(10, decimals)).toFixed(6)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Swap Tokens
          </DialogTitle>
          <DialogDescription>
            Exchange tokens using Jupiter's routing engine for the best rates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Not Connected */}
          {!walletAddress && (
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to view available tokens for swapping.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {walletAddress && (balance.isLoading || isLoadingTokens) && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Loading wallet balance and token data...
              </AlertDescription>
            </Alert>
          )}

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
                onTokenSelect={(token) => setSelectedTokenIn(token)}
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
                    max={selectedTokenIn?.balance || undefined}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value
                      // Проверяем, что введенная сумма не превышает баланс
                      if (selectedTokenIn && parseFloat(value) > (selectedTokenIn.balance || 0)) {
                        return // Не обновляем, если превышает баланс
                      }
                      setAmount(value)
                    }}
                    disabled={isLoading || isSubmitting}
                    className="text-lg"
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedTokenIn) {
                        setAmount(((selectedTokenIn.balance || 0) * 0.25).toString())
                      }
                    }}
                    disabled={!selectedTokenIn || isLoading || isSubmitting}
                    className="px-2 text-xs"
                  >
                    25%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedTokenIn) {
                        setAmount(((selectedTokenIn.balance || 0) * 0.5).toString())
                      }
                    }}
                    disabled={!selectedTokenIn || isLoading || isSubmitting}
                    className="px-2 text-xs"
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMax}
                    disabled={!selectedTokenIn || isLoading || isSubmitting}
                    className="px-3"
                  >
                    Max
                  </Button>
                </div>
              </div>
              {selectedTokenIn && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Balance: {(selectedTokenIn.balance || 0).toFixed(6)} {selectedTokenIn.symbol}</span>
                  <span>≈ ${(selectedTokenIn.usdValue || 0).toFixed(2)}</span>
                </div>
              )}
              
              {/* Dynamic USD calculation for input amount */}
              {selectedTokenIn && amount && parseFloat(amount) > 0 && (
                <div className="flex items-center justify-end text-sm text-blue-600 font-medium">
                  ≈ ${(parseFloat(amount) * selectedTokenIn.price).toFixed(2)} USD
                </div>
              )}
            </div>

            {/* Token Out */}
            <div className="space-y-2">
              <TokenSelector
                label="To"
                selectedToken={selectedTokenOut}
                onTokenSelect={(token) => setSelectedTokenOut(token)}
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
              
              {/* Expected output USD value */}
              {quote && selectedTokenOut && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    {selectedTokenOut.apy?.toFixed(2)}% APY
                  </div>
                  <div className="text-blue-600 font-medium">
                    ≈ ${(parseFloat(formatTokenAmount(parseInt(quote.outAmount), selectedTokenOut.decimals)) * selectedTokenOut.price).toFixed(2)} USD
                  </div>
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
              {swapStep === 'quote' ? (
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
                  className="w-full"
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
              ) : (
                <>
                  {/* Swap & Deposit Button (Left) */}
                  <Button
                    type="submit"
                    disabled={isLoading || isSubmitting || isDepositLoading}
                    className="flex-1 bg-black hover:bg-gray-800 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {swapStep === 'executing' ? 'Executing Swap...' : 
                         swapStep === 'depositing' ? 'Depositing...' : 
                         'Processing...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Swap & Deposit
                      </>
                    )}
                  </Button>
                  
                  {/* Swap Only Button (Right) */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading || isSubmitting || isDepositLoading}
                    className="flex-1"
                    onClick={async () => {
                      if (!quote || !walletAddress) return
                      
                      setSwapStep('executing')
                      setIsSubmitting(true)
                      
                      try {
                        // Получаем swap instructions
                        const instructions = await getSwapInstructions({
                          quoteResponse: quote,
                          userPublicKey: walletAddress,
                          wrapAndUnwrapSol: true,
                          useSharedAccounts: true,
                          dynamicComputeUnitLimit: true,
                          prioritizationFeeLamports: "auto"
                        })

                        // Выполняем только swap
                        const signature = await executeSwap(instructions, walletAddress)
                        
                        // Обновляем баланс
                        refreshBalance()
                        
                        setTransactionSignature(signature)
                        setIsSwapOnly(true)
                        setSwapStep('success')
                      } catch (err) {
                        console.error('Swap failed:', err)
                        setSwapStep('confirm')
                      } finally {
                        setIsSubmitting(false)
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Executing Swap...
                      </>
                    ) : (
                      'Swap Only'
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Quote provided by Jupiter API</p>
            <p>Actual output may vary due to market conditions</p>
          </div>
        </div>
      </DialogContent>

      {/* Success Modal */}
      {swapStep === 'success' && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center text-center space-y-6 py-4">
              {/* Success Icon */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>

              {/* Main Message */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-green-600">
                  {isSwapOnly ? 'Swap Successful!' : 'Swap & Deposit Successful!'}
                </h2>
                <p className="text-lg text-muted-foreground">
                  <span className="font-semibold text-foreground">{amount} {selectedTokenIn?.symbol}</span>
                  {' '}swapped for{' '}
                  <span className="font-semibold text-foreground">
                    {isSwapOnly 
                      ? `${quote ? formatTokenAmount(parseInt(quote.outAmount), selectedTokenOut?.decimals || 9) : '0'} ${selectedTokenOut?.symbol}`
                      : `${depositAmount} ${selectedTokenOut?.symbol}`
                    }
                  </span>
                  {!isSwapOnly && ' and deposited successfully!'}
                </p>
              </div>

              {/* Transaction Links */}
              <div className="space-y-3 w-full">
                {transactionSignature && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        Swap Transaction
                      </span>
                    </div>
                    <a
                      href={`https://solscan.io/tx/${transactionSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      View on Solscan: {transactionSignature.slice(0, 8)}...{transactionSignature.slice(-8)}
                    </a>
                  </div>
                )}
                
                {!isSwapOnly && depositSignature && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        Deposit Transaction
                      </span>
                    </div>
                    <a
                      href={`https://solscan.io/tx/${depositSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 dark:text-green-400 hover:underline break-all"
                    >
                      View on Solscan: {depositSignature.slice(0, 8)}...{depositSignature.slice(-8)}
                    </a>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
