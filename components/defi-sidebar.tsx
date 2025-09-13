"use client"

import * as React from "react"
import {
  IconWallet,
  IconCoins,
  IconArrowsLeftRight,
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

interface DefiSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSwapClick?: () => void
}

export function DefiSidebar({ onSwapClick, ...props }: DefiSidebarProps) {
  const { walletAddress } = useWalletContext();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!px-0 !py-0 !h-auto"
            >
              <a href="#" className="flex justify-start w-full">
                <img 
                  src="/solyd_logo_gor.jpg" 
                  alt="Solyd" 
                  className="w-full max-w-48 h-auto object-contain"
                />
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconCoins className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Wallet Assets</h2>
            </div>
            {walletAddress && onSwapClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwapClick}
                className="h-8 px-2"
              >
                <IconArrowsLeftRight className="w-4 h-4 mr-1" />
                Swap
              </Button>
            )}
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
