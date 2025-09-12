'use client'

import { useState } from 'react'
import { DefiCards } from '@/components/defi-cards'
import { useAggregatorData } from '@/hooks/use-aggregator-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { HelpCircle, Wallet, Coins } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Mock wallet data
const walletAssets = [
  { symbol: 'SOL', balance: '12.45', value: '$1,245.67' },
  { symbol: 'USDC', balance: '2,500.00', value: '$2,500.00' },
  { symbol: 'RAY', balance: '150.25', value: '$89.15' },
]

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet'>('dashboard')
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const { data: aggregatorData, isLoading } = useAggregatorData()

  const DashboardContent = () => (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Earning Opportunities</h1>
        <p className="text-muted-foreground text-sm">
          Discover and participate in various DeFi protocols on Solana
        </p>
      </div>

      {/* DeFi Cards */}
      <DefiCards data={aggregatorData} isLoading={isLoading} />

      {/* Earning Opportunities */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Available Strategies</h2>
        <div className="space-y-4">
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
            }
          ].map((opportunity, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{opportunity.title}</h3>
                  <p className="text-sm text-muted-foreground">{opportunity.protocol}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-500">{opportunity.apy}</div>
                  <div className="text-xs text-muted-foreground">APY</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {opportunity.description}
              </p>
              <Button 
                className="w-full" 
                disabled={opportunity.status === 'coming_soon'}
                variant={opportunity.status === 'coming_soon' ? 'outline' : 'default'}
              >
                {opportunity.status === 'coming_soon' ? 'Coming Soon' : 'Start Earning'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const WalletContent = () => (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Wallet</h1>
        <p className="text-muted-foreground text-sm">
          Manage your assets and connect your wallet
        </p>
      </div>

      {/* Connect Wallet Button */}
      <Card className="p-4 mb-6">
        <div className="text-center">
          <Wallet className="w-8 h-8 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect to start earning with your assets
          </p>
          <Button className="w-full">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </Card>

      {/* Wallet Assets */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Your Assets</h2>
        </div>
        
        <div className="space-y-3">
          {walletAssets.map((asset, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{asset.symbol}</div>
                  <div className="text-sm text-muted-foreground">{asset.balance}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{asset.value}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

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
            <span className="text-xs font-medium">Dashboard</span>
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
