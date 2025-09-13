'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TokenOption {
  symbol: string
  address: string
  decimals: number
  logo: string
  price: number
  balance?: number
  usdValue?: number
  apy?: number
}

interface TokenSelectorProps {
  label: string
  selectedToken: TokenOption | null
  onTokenSelect: (token: TokenOption) => void
  tokens: TokenOption[]
  placeholder?: string
  disabled?: boolean
  showBalance?: boolean
  showApy?: boolean
}

export function TokenSelector({
  label,
  selectedToken,
  onTokenSelect,
  tokens,
  placeholder = "Select token",
  disabled = false,
  showBalance = false,
  showApy = false,
}: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Фильтруем токены по поисковому запросу
  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTokenSelect = (token: TokenOption) => {
    onTokenSelect(token)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between h-12 px-3",
              !selectedToken && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {selectedToken?.logo && (
                <img
                  src={selectedToken.logo}
                  alt={selectedToken.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <span className="font-medium">
                {selectedToken ? selectedToken.symbol : placeholder}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[300px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => (
                <DropdownMenuItem
                  key={token.address}
                  onClick={() => handleTokenSelect(token)}
                  className="flex items-center justify-between p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {token.logo && (
                      <img
                        src={token.logo}
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {token.address.slice(0, 8)}...{token.address.slice(-8)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {showBalance && token.balance !== undefined && (
                      <span className="text-sm font-medium">
                        {token.balance.toFixed(6)}
                      </span>
                    )}
                    {showApy && token.apy !== undefined && (
                      <span className="text-xs text-green-600 font-medium">
                        {token.apy.toFixed(2)}% APY
                      </span>
                    )}
                    {token.price > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ${token.price.toFixed(2)}
                      </span>
                    )}
                    {selectedToken?.address === token.address && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
