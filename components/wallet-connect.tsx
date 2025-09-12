'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Wallet, LogOut, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export function WalletConnect() {
  const { ready, authenticated, login, logout, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);

  if (!ready) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading wallet...</span>
        </div>
      </Card>
    );
  }

  if (!authenticated) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Connect Wallet</span>
          </div>
          <div className="space-y-2">
            <Button onClick={login} className="w-full">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
            <Button 
              onClick={() => connectWallet()} 
              variant="outline" 
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              External Wallet
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const primaryWallet = wallets[0];
  const address = primaryWallet?.address;
  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Wallet Connected</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        
        {address && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Address:</span>
              <Badge variant="secondary" className="text-xs">
                {primaryWallet?.walletClientType || 'Solana'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                {truncatedAddress}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
