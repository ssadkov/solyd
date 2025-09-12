'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Zap, Shield, DollarSign } from 'lucide-react'

export default function Dashboard() {
  // Mock earning opportunities - will be replaced with real protocol integrations
  const earningOpportunities = [
    {
      id: 1,
      title: 'Liquidity Mining',
      description: 'Provide liquidity to earn rewards',
      apy: '12.5%',
      protocol: 'Raydium',
      icon: TrendingUp,
      status: 'active'
    },
    {
      id: 2,
      title: 'Staking Rewards',
      description: 'Stake SOL to earn passive income',
      apy: '8.2%',
      protocol: 'Marinade',
      icon: Shield,
      status: 'active'
    },
    {
      id: 3,
      title: 'Yield Farming',
      description: 'Farm tokens with high yields',
      apy: '25.7%',
      protocol: 'Orca',
      icon: Zap,
      status: 'coming_soon'
    },
    {
      id: 4,
      title: 'Lending',
      description: 'Lend assets to earn interest',
      apy: '6.8%',
      protocol: 'Solend',
      icon: DollarSign,
      status: 'active'
    }
  ]

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Earning Opportunities</h1>
          <p className="text-muted-foreground">
            Discover and participate in various DeFi protocols on Solana
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">
                +0% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No active positions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Earning Opportunities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {earningOpportunities.map((opportunity) => {
            const Icon = opportunity.icon
            return (
              <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{opportunity.protocol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-500">{opportunity.apy}</div>
                      <div className="text-xs text-muted-foreground">APY</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {opportunity.description}
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    disabled={opportunity.status === 'coming_soon'}
                    variant={opportunity.status === 'coming_soon' ? 'outline' : 'default'}
                  >
                    {opportunity.status === 'coming_soon' ? 'Coming Soon' : 'Start Earning'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
