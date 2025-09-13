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
import { WalletAssets } from "@/components/wallet-assets"
import { useWalletContext } from '@/contexts/wallet-context'
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

export function DefiSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { walletAddress } = useWalletContext();
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
          
          {walletAddress ? (
            <WalletAssets address={walletAddress} />
          ) : (
            <div className="text-center text-xs text-muted-foreground py-4">
              Connect wallet to view assets
            </div>
          )}
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
