'use client'

import React, { useState, useEffect } from 'react'
import { useAggregatorData } from '@/hooks/use-aggregator-data'
import { useEnhancedOpportunities } from '@/hooks/use-enhanced-opportunities'
import { useLendPositions } from '@/hooks/use-lend-positions'
import { useEarnings } from '@/hooks/use-earnings'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { HelpCircle, Wallet, Coins, Copy, Check, LogOut, TrendingUp } from 'lucide-react'
import { IconTrendingUp } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWalletContext } from '@/contexts/wallet-context'
import { useTotalBalance } from '@/hooks/use-total-balance'
import { JupiterTokenService, JupiterTokenData } from '@/services/jupiter-token.service'
import { JupiterPriceService } from '@/services/jupiter-price.service'
import { EnhancedOpportunityCard } from '@/components/enhanced-opportunity-card'

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet'>('dashboard')
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const { data: aggregatorData, isLoading } = useAggregatorData()
  
  // Wallet integration
  const { wallet, publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const { balance } = useWalletContext()
  const [copied, setCopied] = useState(false)
  const [tokenData, setTokenData] = useState<JupiterTokenData[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [solPrice, setSolPrice] = useState<number | null>(null)
  
  const address = publicKey?.toString()
  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  
  // Enhanced opportunities data
  const { 
    opportunities: enhancedOpportunities, 
    isLoading: isEnhancedLoading, 
    error: enhancedError 
  } = useEnhancedOpportunities(address)

  // Получаем позиции пользователя для расчета earnings
  const { positions } = useLendPositions(address)
  
  // Мемоизируем адреса активных позиций (только Jupiter)
  const jupiterPositionAddresses = React.useMemo(() => {
    return positions
      .filter(position => position.protocol === 'Jupiter' && parseFloat(position.shares) > 0)
      .map(position => position.jupiterTokenAddress)
      .filter((address): address is string => address !== undefined)
  }, [positions])

  // Получаем earnings данные
  const {
    totalEarningsUSD,
    isLoading: isEarningsLoading,
    error: earningsError
  } = useEarnings(address, jupiterPositionAddresses, positions)
  
  // Получаем общую сумму включая позиции в Jupiter
  const { totalBalance, isLoading: isTotalLoading } = useTotalBalance(address)
  
  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Получаем данные о токенах от Jupiter API
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!address) {
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
  }, [address, balance.tokens])

  // Отдельно загружаем цену SOL если она не загрузилась через основной API
  useEffect(() => {
    const fetchSolPrice = async () => {
      if (balance.sol > 0 && !solPrice) {
        try {
          const priceData = await JupiterPriceService.getPrice('So11111111111111111111111111111111111111112')
          if (priceData) {
            setSolPrice(priceData.usdPrice)
          }
        } catch (error) {
          console.error('Failed to fetch SOL price:', error)
        }
      }
    }

    fetchSolPrice()
  }, [balance.sol, solPrice])

  // Функция для получения данных о токене
  const getTokenInfo = (mint: string): JupiterTokenData | null => {
    const tokenInfo = tokenData.find(token => token.id === mint)
    
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
      }
    }
    
    return tokenInfo || null
  }

  const DashboardContent = () => (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <img 
            src="/solyd_logo_gor.jpg" 
            alt="Solyd" 
            className="h-16 w-auto object-contain"
          />
        </div>
        <p className="text-muted-foreground text-base">
          Discover and participate in various DeFi protocols on Solana
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Earned</p>
              <p className="text-lg font-bold">
                {isEarningsLoading ? '...' : `$${totalEarningsUSD.toFixed(2)}`}
              </p>
            </div>
            <IconTrendingUp className="h-5 w-5 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Positions</p>
              <p className="text-lg font-bold">
                {isLoading ? '...' : positions.filter(p => parseFloat(p.shares) > 0).length}
              </p>
            </div>
            <IconTrendingUp className="h-5 w-5 text-primary" />
          </div>
        </Card>
      </div>

      {/* Enhanced Opportunities */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Enhanced Opportunities</h2>
        <div className="space-y-4">
          {isEnhancedLoading ? (
            // Loading skeleton
            [...Array(3)].map((_, index) => (
              <Card key={index} className="p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div>
                      <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-5 bg-muted rounded w-12 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-8"></div>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded w-full mb-3"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </Card>
            ))
          ) : enhancedOpportunities.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-muted-foreground">No opportunities available</p>
            </Card>
          ) : (
            enhancedOpportunities.slice(0, 5).map((opportunity) => (
              <EnhancedOpportunityCard
                key={`${opportunity.protocol}-${opportunity.token.symbol}`}
                opportunity={opportunity}
                onWithdraw={(opp) => {
                  console.log('Withdraw clicked for:', opp.token.symbol)
                  // TODO: Implement withdraw functionality
                }}
                onSwapAndDeposit={(opp) => {
                  console.log('Swap and deposit clicked for:', opp.token.symbol)
                  // TODO: Implement swap and deposit functionality
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )

  const WalletContent = () => {
    // Создаем список активов из реальных данных
    const allAssets = [
      // Add SOL only if balance > 0
      ...(balance.sol > 0 ? (() => {
        const solTokenInfo = getTokenInfo('So11111111111111111111111111111111111111112')
        const price = solTokenInfo?.usdPrice || solPrice || 0
        const usdValue = price > 0 ? balance.sol * price : 0
        return [{
          symbol: 'SOL',
          mint: 'So11111111111111111111111111111111111111112',
          balance: balance.sol || 0,
          usdValue: usdValue || 0,
          price: price,
          logo: solTokenInfo?.icon || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        }]
      })() : []),
      // Add tokens
      ...balance.tokens.map(token => {
        const tokenInfo = getTokenInfo(token.mint)
        const usdValue = tokenInfo ? token.uiAmount * tokenInfo.usdPrice : 0
        return {
          symbol: tokenInfo?.symbol || token.symbol || 'Unknown',
          mint: token.mint,
          balance: token.uiAmount || 0,
          usdValue: usdValue || 0,
          price: tokenInfo?.usdPrice || 0,
          logo: tokenInfo?.icon || token.logo || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        }
      })
    ].filter(asset => asset.balance > 0 && asset.price > 0 && asset.symbol !== 'Unknown')
    .sort((a, b) => b.usdValue - a.usdValue)

    return (
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Wallet</h1>
          <p className="text-muted-foreground text-sm">
            Manage your assets and connect your wallet
          </p>
        </div>

        {!connected ? (
          /* Connect Wallet Button */
          <Card className="p-4 mb-6">
            <div className="text-center">
              <Wallet className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect to start earning with your assets
              </p>
              <Button className="w-full" onClick={() => setVisible(true)}>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </Card>
        ) : (
          /* Connected Wallet Info */
          <Card className="p-4 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{wallet?.adapter.name}</div>
                    <div className="text-sm text-muted-foreground">{truncatedAddress}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  className="flex items-center space-x-1"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Total Balance */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {isTotalLoading ? '...' : `$${totalBalance.toFixed(2)}`}
                  </span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </Card>
        )}

        {/* Wallet Assets */}
        {connected && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Your Assets</h2>
            </div>
            
            {balance.isLoading || isLoadingTokens ? (
              // Loading skeleton
              [...Array(3)].map((_, index) => (
                <Card key={index} className="p-4 mb-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-16 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-12"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-12"></div>
                    </div>
                  </div>
                </Card>
              ))
            ) : allAssets.length === 0 ? (
              <Card className="p-4 text-center">
                <div className="text-muted-foreground">
                  <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No assets found</p>
                  <p className="text-sm">Your wallet appears to be empty</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {allAssets.map((asset, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <img 
                            src={asset.logo} 
                            alt={asset.symbol}
                            className="w-8 h-8 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) {
                                fallback.style.display = 'flex'
                              }
                            }}
                          />
                          <div className="w-8 h-8 bg-muted rounded-full items-center justify-center text-xs font-bold hidden">
                            {asset.symbol.slice(0, 2)}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{asset.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset.balance.toFixed(6)} {asset.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${asset.usdValue.toFixed(2)}</div>
                        {asset.price > 0 && (
                          <div className="text-sm text-muted-foreground">
                            @${asset.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Main Content */}
      {activeTab === 'dashboard' ? <DashboardContent /> : <WalletContent />}

      {/* Floating Help Button */}
      <Button
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full shadow-lg z-50"
        size="icon"
        onClick={() => setIsHelpOpen(true)}
      >
        <HelpCircle className="w-5 h-5" />
      </Button>

      {/* Bottom Navigation */}
      <div className="border-t border-border bg-card">
        <div className="flex">
          <button
            className={`flex-1 flex flex-col items-center py-3 px-4 ${
              activeTab === 'dashboard' 
                ? 'text-primary border-t-2 border-primary' 
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Coins className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Earn</span>
          </button>
          <button
            className={`flex-1 flex flex-col items-center py-3 px-4 ${
              activeTab === 'wallet' 
                ? 'text-primary border-t-2 border-primary' 
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('wallet')}
          >
            <Wallet className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Wallet</span>
          </button>
        </div>
      </div>

      {/* Help Modal */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Help & Support
            </DialogTitle>
            <DialogDescription>
              Get help and learn about Solyd
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Getting Started</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• How to connect your wallet</li>
                <li>• Understanding DeFi protocols</li>
                <li>• Managing your assets</li>
                <li>• Security best practices</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-sm mb-2">Frequently Asked Questions</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <h5 className="font-medium">What is Solyd?</h5>
                  <p className="text-muted-foreground">
                    Solyd is a DeFi dashboard that aggregates earning opportunities from various Solana protocols.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium">Is it safe?</h5>
                  <p className="text-muted-foreground">
                    We only integrate with audited and trusted protocols. Always do your own research.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium">What fees are involved?</h5>
                  <p className="text-muted-foreground">
                    Fees depend on the specific protocol you interact with. We don't charge additional fees.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
