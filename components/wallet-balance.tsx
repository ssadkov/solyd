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
  const { sol, tokens, isLoading, error } = useWalletBalance(address);

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
        <div className="flex items-center space-x-2">
          <Coins className="h-4 w-4" />
          <span className="text-sm font-medium">Wallet Balance</span>
        </div>

        {/* SOL Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">SOL:</span>
            <Badge variant="secondary" className="text-xs">
              Native
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
              {isLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                `${sol.toFixed(4)} SOL`
              )}
            </code>
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
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tokens.map((token, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {token.symbol || `${token.mint.slice(0, 4)}...`}
                  </span>
                  <span className="text-muted-foreground">
                    {token.uiAmount.toFixed(4)}
                  </span>
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
