'use client';

import { useState, useCallback } from 'react';
import { PrivyTransactionService, PrivyTransactionRequest, PrivyTransactionResponse } from '@/services/privy-transaction.service';

// Types
export interface TransactionState {
  isSending: boolean;
  transactionHash: string | null;
  error: string | null;
  sponsored: boolean;
  canSponsor: boolean;
  sponsorshipReason?: string;
  message?: string;
}

export interface UseTransactionSenderReturn {
  // State
  state: TransactionState;
  
  // Actions
  sendTransaction: (request: Omit<PrivyTransactionRequest, 'walletId'> & { walletId: string }) => Promise<PrivyTransactionResponse>;
  resetTransaction: () => void;
  validateSponsorship: (walletId: string, amount: number, mint?: string) => Promise<void>;
  
  // Utils
  getExplorerUrl: (hash: string) => string;
  getWalletExplorerUrl: (address: string) => string;
}

export function useTransactionSender(): UseTransactionSenderReturn {
  const [state, setState] = useState<TransactionState>({
    isSending: false,
    transactionHash: null,
    error: null,
    sponsored: false,
    canSponsor: true,
    sponsorshipReason: undefined,
  });

  // Reset transaction state
  const resetTransaction = useCallback(() => {
    setState({
      isSending: false,
      transactionHash: null,
      error: null,
      sponsored: false,
      canSponsor: true,
      sponsorshipReason: undefined,
    });
  }, []);

  // Validate if transaction can be sponsored
  const validateSponsorship = useCallback(async (walletId: string, amount: number, mint?: string) => {
    try {
      const result = await PrivyTransactionService.canSponsorTransaction(walletId, amount, mint);
      setState(prev => ({
        ...prev,
        canSponsor: result.canSponsor,
        sponsorshipReason: result.reason,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        canSponsor: false,
        sponsorshipReason: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Send transaction
  const sendTransaction = useCallback(async (request: Omit<PrivyTransactionRequest, 'walletId'> & { walletId: string }): Promise<PrivyTransactionResponse> => {
    setState(prev => ({
      ...prev,
      isSending: true,
      error: null,
      transactionHash: null,
    }));

    try {
      // First validate sponsorship
      const sponsorshipResult = await PrivyTransactionService.canSponsorTransaction(
        request.walletId,
        request.amount,
        request.mint
      );

      if (!sponsorshipResult.canSponsor) {
        const error = `Cannot sponsor transaction: ${sponsorshipResult.reason}`;
        setState(prev => ({
          ...prev,
          isSending: false,
          error,
          canSponsor: false,
          sponsorshipReason: sponsorshipResult.reason,
        }));
        return {
          success: false,
          error,
          sponsored: false,
        };
      }

      // Send the transaction
      const response = await PrivyTransactionService.sendGaslessTransaction(request);

      setState(prev => ({
        ...prev,
        isSending: false,
        transactionHash: response.transactionHash || null,
        error: response.error || null,
        sponsored: response.sponsored,
        message: response.message || null,
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isSending: false,
        error: errorMessage,
      }));
      
      return {
        success: false,
        error: errorMessage,
        sponsored: false,
      };
    }
  }, []);

  // Get transaction explorer URL
  const getExplorerUrl = useCallback((hash: string) => {
    return PrivyTransactionService.getTransactionExplorerUrl(hash);
  }, []);

  // Get wallet explorer URL
  const getWalletExplorerUrl = useCallback((address: string) => {
    return PrivyTransactionService.getWalletExplorerUrl(address);
  }, []);

  return {
    state,
    sendTransaction,
    resetTransaction,
    validateSponsorship,
    getExplorerUrl,
    getWalletExplorerUrl,
  };
}
