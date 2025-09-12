"use client"

import * as React from "react"
import {
  IconWallet,
  IconCoins,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { WalletConnect } from "@/components/wallet-connect"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [],
  navSecondary: [],
}

// Mock wallet data
const walletAssets = [
  { symbol: 'SOL', balance: '12.45', value: '$1,245.67' },
  { symbol: 'USDC', balance: '2,500.00', value: '$2,500.00' },
  { symbol: 'RAY', balance: '150.25', value: '$89.15' },
]

export function DefiSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconCoins className="!size-5" />
                <span className="text-3xl font-bold text-primary">Solyd</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Wallet Connect Component */}
        <div className="p-4">
          <WalletConnect />
        </div>

        <Separator />

        {/* Wallet Assets */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <IconCoins className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Wallet Assets</h2>
          </div>
          
          <div className="space-y-3">
            {walletAssets.map((asset, index) => (
              <Card key={index} className="p-3">
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

      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-4 text-center">
          <p className="text-sm font-semibold text-primary mb-1">
            SolYd
          </p>
          <p className="text-xs text-muted-foreground">
            solid yield farming on solana
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
