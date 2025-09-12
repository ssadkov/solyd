'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Wallet, Coins, TrendingUp } from 'lucide-react'

export default function Sidebar() {
  // Mock wallet data - will be replaced with real data later
  const walletAssets = [
    { symbol: 'SOL', balance: '12.45', value: '$1,245.67' },
    { symbol: 'USDC', balance: '2,500.00', value: '$2,500.00' },
    { symbol: 'RAY', balance: '150.25', value: '$89.15' },
  ]

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">Solyd</h1>
        <p className="text-sm text-muted-foreground mt-1">DeFi Dashboard</p>
      </div>

      {/* Wallet Button */}
      <div className="p-6">
        <Button className="w-full" size="lg">
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      </div>

      <Separator />

      {/* Wallet Assets */}
      <div className="flex-1 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Wallet Assets</h2>
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

      {/* Vault Section - Placeholder */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Vault</h2>
        </div>
        <Card className="p-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Vault integration coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
