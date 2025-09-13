'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Send, X, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTransactionSender } from '@/hooks/use-transaction-sender';

interface SendAssetModalProps {
  asset: {
    symbol: string;
    balance: string;
    value: string;
    mint: string;
    logo?: string;
    decimals?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function SendAssetModal({ asset, isOpen, onClose }: SendAssetModalProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(true);
  
  const {
    state,
    sendTransaction,
    resetTransaction,
    getExplorerUrl,
  } = useTransactionSender();

  // Validate recipient address
  useEffect(() => {
    if (recipient) {
      // Basic Solana address validation
      const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient);
      setIsValidAddress(isValid);
    }
  }, [recipient]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRecipient('');
      setAmount('');
      resetTransaction();
    }
  }, [isOpen, resetTransaction]);

  const handleSend = async () => {
    if (!recipient || !amount) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidAddress) {
      alert('Please enter a valid Solana address');
      return;
    }

    // Check if amount is valid
    if (parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Sponsorship removed - using standard wallet transactions

    try {
      const response = await sendTransaction({
        recipient,
        amount: parseFloat(amount),
        mint: asset.mint === 'So11111111111111111111111111111111111111112' ? undefined : asset.mint,
        decimals: asset.decimals || 9, // Use actual token decimals or default to 9
      });

      if (response.success && response.transactionHash) {
        // Success - transaction sent with real hash
        setTimeout(() => {
          onClose();
        }, 2000); // Close after 2 seconds to show success
      }
      // If success but no transactionHash, keep modal open to show message
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  const handleMaxAmount = () => {
    setAmount(asset.balance);
  };

  const handleClose = () => {
    if (!state.isSending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send {asset.symbol}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Success State */}
                   {state.transactionHash && (
                     <Card className="p-3 bg-green-50 border-green-200">
                       <div className="flex items-center gap-2">
                         <CheckCircle className="h-5 w-5 text-green-600" />
                         <div className="flex-1">
                           <div className="font-medium text-green-800">Transaction Sent!</div>
                           <div className="text-sm text-green-600">
                             Hash: {state.transactionHash.slice(0, 8)}...{state.transactionHash.slice(-8)}
                           </div>
                         </div>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => window.open(getExplorerUrl(state.transactionHash!), '_blank')}
                         >
                           <ExternalLink className="h-4 w-4" />
                         </Button>
                       </div>
                     </Card>
                   )}

                   {state.message && !state.transactionHash && (
                     <Card className="p-3 bg-blue-50 border-blue-200">
                       <div className="flex items-center gap-2">
                         <CheckCircle className="h-5 w-5 text-blue-600" />
                         <div className="flex-1">
                           <div className="font-medium text-blue-800">Transaction Prepared</div>
                           <div className="text-sm text-blue-600">{state.message}</div>
                         </div>
                       </div>
                     </Card>
                   )}

          {/* Error State */}
          {state.error && (
            <Card className="p-3 bg-red-50 border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <div className="font-medium text-red-800">Transaction Failed</div>
                  <div className="text-sm text-red-600">{state.error}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Sponsorship removed - using standard wallet transactions */}

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
              <div className="flex-1">
                <div className="font-medium">{asset.symbol}</div>
                <div className="text-sm text-muted-foreground">
                  Balance: {asset.balance}
                </div>
              </div>
              {/* Sponsorship removed */}
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
              className={`font-mono text-sm ${!isValidAddress && recipient ? 'border-red-500' : ''}`}
              disabled={state.isSending}
            />
            {!isValidAddress && recipient && (
              <p className="text-sm text-red-500">Invalid Solana address format</p>
            )}
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
                disabled={state.isSending}
              />
              <Button
                variant="outline"
                onClick={handleMaxAmount}
                className="px-3"
                disabled={state.isSending}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={state.isSending}
            >
              {(state.transactionHash || state.message) ? 'Close' : 'Cancel'}
            </Button>
            {!state.transactionHash && !state.message && (
              <Button
                onClick={handleSend}
                className="flex-1"
                disabled={
                  state.isSending || 
                  !recipient || 
                  !amount || 
                  !isValidAddress
                }
              >
                {state.isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
