'use client'

import { DefiSidebar } from "@/components/defi-sidebar"
import { DefiCards } from "@/components/defi-cards"
import { EnhancedOpportunityCard } from "@/components/enhanced-opportunity-card"
import HelpPanel from "@/components/layout/HelpPanel"
import MobileLayout from "@/components/mobile-layout"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAggregatorData } from "@/hooks/use-aggregator-data"
import { useEnhancedOpportunities } from "@/hooks/use-enhanced-opportunities"
import { useWallet } from '@solana/wallet-adapter-react'
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Home() {
  const isMobile = useIsMobile()
  const { data: aggregatorData, isLoading, error } = useAggregatorData()
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toString()
  
  // Используем новый хук для получения объединенных данных
  const { 
    opportunities: enhancedOpportunities, 
    isLoading: isEnhancedLoading, 
    error: enhancedError 
  } = useEnhancedOpportunities(walletAddress)

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

  // Mobile layout
  if (isMobile) {
    return <MobileLayout />
  }

  // Desktop layout
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <DefiSidebar variant="inset" />
      <SidebarInset>
        <div className="flex h-screen">
          {/* Main Dashboard Area */}
          <div className="flex-1 flex flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Header */}
                <div className="px-4 lg:px-6">
                  <h1 className="text-3xl font-bold mb-2">Earning Opportunities</h1>
                  <p className="text-muted-foreground">
                    Discover and participate in various DeFi protocols on Solana
                  </p>
                </div>
                
                {/* DeFi Cards */}
                <DefiCards data={aggregatorData} isLoading={isLoading} />
                
                {/* Enhanced Earning Opportunities Grid */}
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="col-span-full bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
                        <p className="text-destructive">Failed to load opportunities</p>
                        <p className="text-sm text-muted-foreground mt-2">{enhancedError}</p>
                      </div>
                    ) : enhancedOpportunities.length === 0 ? (
                      // Empty state
                      <div className="col-span-full bg-muted/50 border rounded-lg p-6 text-center">
                        <p className="text-muted-foreground">No opportunities available</p>
                      </div>
                    ) : (
                      // Enhanced opportunity cards
                      enhancedOpportunities.slice(0, 6).map((opportunity, index) => (
                        <EnhancedOpportunityCard
                          key={index}
                          opportunity={opportunity}
                          onAddMore={(opp) => {
                            console.log('Add More clicked for:', opp.token.symbol)
                            // TODO: Implement add more functionality
                          }}
                          onWithdraw={(opp) => {
                            console.log('Withdraw clicked for:', opp.token.symbol)
                            // TODO: Implement withdraw functionality
                          }}
                          onStartEarning={(opp) => {
                            console.log('Start Earning clicked for:', opp.token.symbol)
                            // TODO: Implement start earning functionality
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Help Panel */}
          <HelpPanel />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}