'use client'

import { DefiSidebar } from "@/components/defi-sidebar"
import { DefiCards } from "@/components/defi-cards"
import HelpPanel from "@/components/layout/HelpPanel"
import MobileLayout from "@/components/mobile-layout"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAggregatorData } from "@/hooks/use-aggregator-data"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Home() {
  const isMobile = useIsMobile()
  const { data: aggregatorData, isLoading, error } = useAggregatorData()

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
                
                {/* Earning Opportunities Grid */}
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
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
                    ) : error ? (
                      // Error state
                      <div className="col-span-full bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
                        <p className="text-destructive">Failed to load opportunities</p>
                        <p className="text-sm text-muted-foreground mt-2">{error}</p>
                      </div>
                    ) : aggregatorData.length === 0 ? (
                      // Empty state
                      <div className="col-span-full bg-muted/50 border rounded-lg p-6 text-center">
                        <p className="text-muted-foreground">No opportunities available</p>
                      </div>
                    ) : (
                      // Real data cards
                      aggregatorData.slice(0, 6).map((opportunity, index) => (
                        <div key={index} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                {opportunity.token.logo ? (
                                  <img 
                                    src={opportunity.token.logo} 
                                    alt={opportunity.token.symbol}
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                    }}
                                  />
                                ) : null}
                                <span className={`${opportunity.token.logo ? 'hidden' : ''} text-muted-foreground`}>
                                  {opportunity.token.symbol.slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">{opportunity.token.symbol} Lending</h3>
                                <p className="text-sm text-muted-foreground">{opportunity.protocol}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-500">{opportunity.apy.toFixed(2)}%</div>
                              <div className="text-xs text-muted-foreground">APY</div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Lend {opportunity.token.symbol} to earn {opportunity.apy.toFixed(2)}% APY
                          </p>
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-sm">
                              <span className="text-muted-foreground">TVL: </span>
                              <span className="font-medium">${(opportunity.tvl / 1000000).toFixed(1)}M</span>
                            </div>
                            <div className="text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                opportunity.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {opportunity.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <button 
                            className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                              !opportunity.isActive 
                                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                            disabled={!opportunity.isActive}
                          >
                            {!opportunity.isActive ? 'Coming Soon' : 'Start Earning'}
                          </button>
                        </div>
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