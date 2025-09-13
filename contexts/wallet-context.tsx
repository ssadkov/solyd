'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletBalance } from '@/hooks/use-wallet-balance'

interface WalletContextType {
  publicKey: string | null
  walletAddress: string | undefined
  balance: {
    sol: number
    tokens: Array<{
      mint: string
      amount: string
      decimals: number
      uiAmount: number
      symbol?: string
      logo?: string
    }>
    isLoading: boolean
    error: string | null
  }
  refreshBalance: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toString()
  const balance = useWalletBalance(walletAddress)

  const value: WalletContextType = {
    publicKey: walletAddress || null,
    walletAddress,
    balance: {
      sol: balance.sol,
      tokens: balance.tokens,
      isLoading: balance.isLoading,
      error: balance.error,
    },
    refreshBalance: balance.refreshBalance
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}
