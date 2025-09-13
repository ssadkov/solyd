'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Coins, AlertCircle } from 'lucide-react';
import { useWalletBalance } from '@/hooks/use-wallet-balance';

interface WalletBalanceProps {
  address: string;
}

export function WalletBalance({ address }: WalletBalanceProps) {
  const { 
    sol, 
    tokens, 
    isLoading, 
    error, 
    solUsdPrice, 
    solUsdValue, 
    solPriceChange24h, 
    totalUsdValue 
  } = useWalletBalance(address);

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load balance</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4" />
            <span className="text-sm font-medium">Wallet Balance</span>
          </div>
          {totalUsdValue !== undefined && (
            <div className="text-right">
              <div className="text-sm font-semibold">
                ${totalUsdValue.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* SOL Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">SOL:</span>
            <Badge variant="secondary" className="text-xs">
              Native
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                {isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  `${sol.toFixed(4)} SOL`
                )}
              </code>
            </div>
            {solUsdValue !== undefined && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>${solUsdValue.toFixed(2)}</span>
                {solPriceChange24h !== undefined && (
                  <span className={`${solPriceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {solPriceChange24h >= 0 ? '+' : ''}{solPriceChange24h.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tokens */}
        {tokens.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tokens:</span>
              <Badge variant="outline" className="text-xs">
                {tokens.length}
              </Badge>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {tokens.map((token, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">
                      {token.symbol || `${token.mint.slice(0, 4)}...`}
                    </span>
                    <span className="text-muted-foreground">
                      {token.uiAmount.toFixed(4)}
                    </span>
                  </div>
                  {token.usdValue !== undefined && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>${token.usdValue.toFixed(2)}</span>
                      {token.priceChange24h !== undefined && (
                        <span className={`${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && tokens.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No tokens found
          </div>
        )}
      </div>
    </Card>
  );
}
