'use client'

import { DefiSidebar } from "@/components/defi-sidebar"
import { EnhancedOpportunityCard } from "@/components/enhanced-opportunity-card"
import MobileLayout from "@/components/mobile-layout"
import { SwapModal } from "@/components/swap-modal"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAggregatorData } from "@/hooks/use-aggregator-data"
import { useEnhancedOpportunities } from "@/hooks/use-enhanced-opportunities"
import { useLendPositions } from "@/hooks/use-lend-positions"
import { useEarnings } from "@/hooks/use-earnings"
import { useWallet } from '@solana/wallet-adapter-react'
import { IconTrendingUp } from "@tabler/icons-react"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { WalletProvider } from '@/contexts/wallet-context'
import { useState, useMemo } from 'react'

export default function Home() {
  const isMobile = useIsMobile()
  const { data: aggregatorData, isLoading, error } = useAggregatorData()
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toString()
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)
  const [presetTokenOut, setPresetTokenOut] = useState<{
    symbol: string
    address: string
    decimals: number
    logo: string
    price: number
    apy?: number
  } | undefined>(undefined)
  
  // Используем новый хук для получения объединенных данных
  const { 
    opportunities: enhancedOpportunities, 
    isLoading: isEnhancedLoading, 
    error: enhancedError 
  } = useEnhancedOpportunities(walletAddress)

  // Получаем позиции пользователя для расчета earnings
  const { positions } = useLendPositions(walletAddress)
  
  // Мемоизируем адреса активных позиций (только Jupiter)
  const jupiterPositionAddresses = useMemo(() => {
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
  } = useEarnings(walletAddress, jupiterPositionAddresses, positions)

  // Show loading state while determining device type
  if (isMobile === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <WalletProvider>
      {/* Mobile layout */}
      {isMobile ? (
        <MobileLayout />
      ) : (
        /* Desktop layout */
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <DefiSidebar 
          variant="inset" 
          onSwapClick={() => {
            setPresetTokenOut(undefined)
            setIsSwapModalOpen(true)
          }}
        />
        <SidebarInset>
          <div className="flex h-screen">
            {/* Main Dashboard Area - Full Width with More Breathing Room */}
            <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8">
                  {/* Header with Total Earned card on the right */}
                  <div className="px-6 lg:px-8 flex justify-between items-start">
                    <div className="flex-1">
                      <h1 className="text-4xl font-bold mb-3">Earning Opportunities</h1>
                      <p className="text-lg text-muted-foreground">
                        Discover and participate in various DeFi protocols on Solana
                      </p>
                    </div>
                    
                    {/* Total Earned Card - positioned on the right */}
                    <div className="ml-8">
                      <div className="bg-gradient-to-t from-primary/5 to-card dark:bg-card border rounded-lg p-6 min-w-[280px] shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Total Earned</span>
                          <div className="flex items-center gap-1 text-green-600 text-sm">
                            <IconTrendingUp className="w-4 h-4" />
                            <span>{isEarningsLoading ? '...' : '+0%'}</span>
                          </div>
                        </div>
                        <div className="text-3xl font-bold mb-2">
                          {isEarningsLoading ? '...' : `$${totalEarningsUSD.toFixed(2)}`}
                        </div>
                        <div className={`text-sm ${totalEarningsUSD > 0 ? 'text-muted-foreground' : 'text-primary font-medium'}`}>
                          {isEarningsLoading ? 'Loading...' : (totalEarningsUSD > 0 ? 'Lifetime earnings' : 'Start earn today!')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Earning Opportunities Grid with more spacing */}
                  <div className="px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {isEnhancedLoading ? (
                        // Loading skeleton
                        [...Array(6)].map((_, index) => (
                          <div key={index} className="bg-card border rounded-lg p-6 animate-pulse">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-muted rounded-full"></div>
                                <div>
                                  <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                                  <div className="h-3 bg-muted rounded w-16"></div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="h-6 bg-muted rounded w-12 mb-1"></div>
                                <div className="h-3 bg-muted rounded w-8"></div>
                              </div>
                            </div>
                            <div className="h-3 bg-muted rounded w-full mb-4"></div>
                            <div className="h-8 bg-muted rounded w-full"></div>
                          </div>
                        ))
                      ) : enhancedError ? (
                        // Error state
                        <div className="col-span-full bg-destructive/10 border border-destructive/20 rounded-lg p-8 text-center">
                          <p className="text-destructive text-lg">Failed to load opportunities</p>
                          <p className="text-sm text-muted-foreground mt-2">{enhancedError}</p>
                        </div>
                      ) : enhancedOpportunities.length === 0 ? (
                        // Empty state
                        <div className="col-span-full bg-muted/50 border rounded-lg p-8 text-center">
                          <p className="text-muted-foreground text-lg">No opportunities available</p>
                        </div>
                      ) : (
                        // Enhanced opportunity cards
                        enhancedOpportunities.slice(0, 6).map((opportunity, index) => (
                          <EnhancedOpportunityCard
                            key={index}
                            opportunity={opportunity}
                            onWithdraw={(opp) => {
                              console.log('Withdraw clicked for:', opp.token.symbol)
                              // TODO: Implement withdraw functionality
                            }}
                            onSwapAndDeposit={(opportunity) => {
                              setPresetTokenOut({
                                symbol: opportunity.token.symbol,
                                address: opportunity.token.address,
                                decimals: opportunity.token.decimals,
                                logo: opportunity.token.logo,
                                price: opportunity.token.price,
                                apy: opportunity.apy
                              })
                              setIsSwapModalOpen(true)
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      )}
      
      {/* Swap Modal */}
      <SwapModal 
        isOpen={isSwapModalOpen}
        onClose={() => {
          setIsSwapModalOpen(false)
          setPresetTokenOut(undefined)
        }}
        presetTokenOut={presetTokenOut}
      />
    </WalletProvider>
  )
}