'use client';

import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { AlertCircle, Coins, Copy, Check, Send } from 'lucide-react';
import { useWalletContext } from '@/contexts/wallet-context';
import { SendAssetModal } from './send-asset-modal';
import { useState } from 'react';

interface WalletAssetsProps {
  address: string;
}

export function WalletAssets({ address }: WalletAssetsProps) {
  const { balance } = useWalletContext();
  const { sol, tokens, isLoading, error } = balance;
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const copyMintAddress = async (mint: string) => {
    await navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const handleSendAsset = (asset: any) => {
    setSelectedAsset(asset);
    setSendModalOpen(true);
  };

  // Get wallet ID from address (for now, using address as wallet ID)
  // In a real app, you'd get this from wallet adapter
  const walletId = address;

  const handleCloseModal = () => {
    setSendModalOpen(false);
    setSelectedAsset(null);
  };

  if (error) {
    return (
      <div className="space-y-3">
        {[
          { symbol: 'SOL', balance: '0.0000', value: '$0.00' },
          { symbol: 'USDC', balance: '0.0000', value: '$0.00' },
          { symbol: 'RAY', balance: '0.0000', value: '$0.00' },
        ].map((asset, index) => (
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
        <div className="text-center text-xs text-destructive">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          Failed to load balance
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((index) => (
          <Card key={index} className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Combine SOL (if > 0) and tokens
  const allAssets = [
    // Add SOL only if balance > 0
    ...(sol > 0 ? [{
      symbol: 'SOL',
      balance: sol.toFixed(2),
      value: `${sol.toFixed(2)} SOL`,
      mint: 'So11111111111111111111111111111111111111112',
      logo: undefined,
      decimals: 9, // SOL has 9 decimals
    }] : []),
    // Add tokens
    ...tokens.map(token => ({
      symbol: token.symbol || `${token.mint.slice(0, 4)}...`,
      balance: token.uiAmount.toFixed(2),
      value: `${token.uiAmount.toFixed(2)}`,
      mint: token.mint,
      logo: token.logo,
      decimals: token.decimals, // Use actual token decimals
    }))
  ];

  if (allAssets.length === 0) {
    return (
      <div className="text-center text-xs text-muted-foreground py-4">
        <Coins className="h-4 w-4 mx-auto mb-2" />
        No assets found
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {allAssets.map((asset, index) => (
          <Card key={index} className="p-3">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {asset.logo ? (
                    <img 
                      src={asset.logo} 
                      alt={asset.symbol}
                      className="w-4 h-4 rounded-full"
                      onError={(e) => {
                        console.log(`Failed to load logo for ${asset.symbol}:`, asset.logo);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log(`Successfully loaded logo for ${asset.symbol}:`, asset.logo);
                      }}
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      ?
                    </div>
                  )}
                  <div className="font-medium">{asset.symbol}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyMintAddress(asset.mint)}
                    className="h-6 w-6 p-0"
                  >
                    {copiedMint === asset.mint ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-bold text-lg">{asset.value}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSendAsset(asset)}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  title={`Send ${asset.symbol}`}
                >
                  <Send className="h-3 w-3 text-gray-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
    {/* Send Asset Modal */}
    {selectedAsset && (
      <SendAssetModal
        asset={selectedAsset}
        walletId={walletId}
        isOpen={sendModalOpen}
        onClose={handleCloseModal}
      />
    )}
    </>
  );
}
