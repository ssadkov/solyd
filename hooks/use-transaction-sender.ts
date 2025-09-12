'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SOLANA_CONFIG } from '@/lib/solana-config';

// Types
export interface TransactionState {
  isSending: boolean;
  transactionHash: string | null;
  error: string | null;
  message?: string;
}

export interface UseTransactionSenderReturn {
  // State
  state: TransactionState;
  
  // Actions
  sendTransaction: (request: {
    recipient: string;
    amount: number;
    mint?: string;
    decimals?: number;
  }) => Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }>;
  resetTransaction: () => void;
  
  // Utils
  getExplorerUrl: (hash: string) => string;
  getWalletExplorerUrl: (address: string) => string;
}

export function useTransactionSender(): UseTransactionSenderReturn {
  const { publicKey, sendTransaction } = useWallet();
  
  const [state, setState] = useState<TransactionState>({
    isSending: false,
    transactionHash: null,
    error: null,
  });

  // Reset transaction state
  const resetTransaction = useCallback(() => {
    setState({
      isSending: false,
      transactionHash: null,
      error: null,
    });
  }, []);

  // Send transaction
  const sendTransactionHandler = useCallback(async (request: {
    recipient: string;
    amount: number;
    mint?: string;
    decimals?: number;
  }): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> => {
    if (!publicKey) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    // Check wallet balance for SOL (needed for transaction fees)
    const connection = new Connection(SOLANA_CONFIG.rpcUrl, SOLANA_CONFIG.commitment);
    try {
      const balance = await connection.getBalance(publicKey);
      const minBalance = 5000; // Minimum 0.000005 SOL for transaction fees
      
      if (balance < minBalance) {
        return {
          success: false,
          error: `Insufficient SOL for transaction fees. Need at least 0.000005 SOL, have ${balance / LAMPORTS_PER_SOL} SOL`
        };
      }
    } catch (error) {
      console.warn('Could not check wallet balance:', error);
    }

    setState(prev => ({
      ...prev,
      isSending: true,
      error: null,
      transactionHash: null,
    }));

    try {
      const connection = new Connection(SOLANA_CONFIG.rpcUrl, SOLANA_CONFIG.commitment);
      const fromPublicKey = publicKey;
      const toPublicKey = new PublicKey(request.recipient);

      let transaction: Transaction;

      if (request.mint) { // SPL Token transfer
        // Check token balance
        const mintPublicKey = new PublicKey(request.mint);
        const senderTokenAccount = await getAssociatedTokenAddress(mintPublicKey, fromPublicKey);
        
        console.log('Token transfer details:', {
          mint: request.mint,
          amount: request.amount,
          decimals: request.decimals,
          calculatedAmount: request.amount * (10 ** (request.decimals || 9))
        });
        
        try {
          const tokenBalance = await connection.getTokenAccountBalance(senderTokenAccount);
          const requiredAmount = request.amount * (10 ** (request.decimals || 9));
          
          console.log('Token balance check:', {
            currentBalance: tokenBalance.value.amount,
            requiredAmount: requiredAmount.toString(),
            uiAmount: tokenBalance.value.uiAmount,
            decimals: tokenBalance.value.decimals
          });
          
          if (tokenBalance.value.amount < requiredAmount.toString()) {
            return {
              success: false,
              error: `Insufficient token balance. Need ${request.amount}, have ${tokenBalance.value.uiAmount || 0}`
            };
          }
        } catch (error) {
          console.warn('Could not check token balance:', error);
        }
        
        const recipientTokenAccount = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);

        transaction = new Transaction().add(
          createTransferInstruction(
            senderTokenAccount,
            recipientTokenAccount,
            fromPublicKey,
            request.amount * (10 ** (request.decimals || 9)), // Convert to token units
            [],
            TOKEN_PROGRAM_ID
          )
        );
      } else { // SOL transfer
        // Check SOL balance for transfer
        try {
          const balance = await connection.getBalance(fromPublicKey);
          const requiredAmount = request.amount * LAMPORTS_PER_SOL;
          const feeEstimate = 5000; // Estimated fee
          
          if (balance < requiredAmount + feeEstimate) {
            return {
              success: false,
              error: `Insufficient SOL balance. Need ${request.amount + (feeEstimate / LAMPORTS_PER_SOL)} SOL, have ${balance / LAMPORTS_PER_SOL} SOL`
            };
          }
        } catch (error) {
          console.warn('Could not check SOL balance:', error);
        }
        
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: request.amount * LAMPORTS_PER_SOL,
          })
        );
      }

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPublicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);

      setState(prev => ({
        ...prev,
        isSending: false,
        transactionHash: signature,
        message: 'Transaction sent successfully!',
      }));

      return {
        success: true,
        transactionHash: signature,
      };
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
      };
    }
  }, [publicKey, sendTransaction]);

  // Get transaction explorer URL
  const getExplorerUrl = useCallback((hash: string) => {
    return `https://solscan.io/tx/${hash}`;
  }, []);

  // Get wallet explorer URL
  const getWalletExplorerUrl = useCallback((address: string) => {
    return `https://solscan.io/account/${address}`;
  }, []);

  return {
    state,
    sendTransaction: sendTransactionHandler,
    resetTransaction,
    getExplorerUrl,
    getWalletExplorerUrl,
  };
}