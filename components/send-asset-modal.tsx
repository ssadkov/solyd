'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Send, X } from 'lucide-react';

interface SendAssetModalProps {
  asset: {
    symbol: string;
    balance: string;
    value: string;
    mint: string;
    logo?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function SendAssetModal({ asset, isOpen, onClose }: SendAssetModalProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!recipient || !amount) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement actual send transaction
      console.log('Sending:', {
        asset: asset.symbol,
        amount,
        recipient,
        mint: asset.mint
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully sent ${amount} ${asset.symbol} to ${recipient}`);
      onClose();
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Send failed:', error);
      alert('Send failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setAmount(asset.balance);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send {asset.symbol}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Asset Info */}
          <Card className="p-3">
            <div className="flex items-center gap-2">
              {asset.logo && (
                <img 
                  src={asset.logo} 
                  alt={asset.symbol}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">{asset.symbol}</div>
                <div className="text-sm text-muted-foreground">
                  Balance: {asset.balance}
                </div>
              </div>
            </div>
          </Card>

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Solana address..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleMaxAmount}
                className="px-3"
              >
                Max
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1"
              disabled={isLoading || !recipient || !amount}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
