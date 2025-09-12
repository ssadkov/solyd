import { DefiSidebar } from "@/components/defi-sidebar"
import { DefiCards } from "@/components/defi-cards"
import HelpPanel from "@/components/layout/HelpPanel"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Home() {
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
                <DefiCards />
                
                {/* Earning Opportunities Grid */}
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Mock earning opportunities */}
                    {[
                      {
                        title: 'Liquidity Mining',
                        description: 'Provide liquidity to earn rewards',
                        apy: '12.5%',
                        protocol: 'Raydium',
                        status: 'active'
                      },
                      {
                        title: 'Staking Rewards',
                        description: 'Stake SOL to earn passive income',
                        apy: '8.2%',
                        protocol: 'Marinade',
                        status: 'active'
                      },
                      {
                        title: 'Yield Farming',
                        description: 'Farm tokens with high yields',
                        apy: '25.7%',
                        protocol: 'Orca',
                        status: 'coming_soon'
                      },
                    ].map((opportunity, index) => (
                      <div key={index} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{opportunity.title}</h3>
                            <p className="text-sm text-muted-foreground">{opportunity.protocol}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-500">{opportunity.apy}</div>
                            <div className="text-xs text-muted-foreground">APY</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {opportunity.description}
                        </p>
                        <button 
                          className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                            opportunity.status === 'coming_soon' 
                              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                          disabled={opportunity.status === 'coming_soon'}
                        >
                          {opportunity.status === 'coming_soon' ? 'Coming Soon' : 'Start Earning'}
                        </button>
                      </div>
                    ))}
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