import { SOLANA_CONFIG } from '@/lib/solana-config';

// Types
export interface PrivyTransactionRequest {
  walletId: string;
  recipient: string;
  amount: number;
  mint?: string; // For SPL tokens, undefined for SOL
  decimals?: number;
}

export interface PrivyTransactionResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  sponsored: boolean;
  message?: string;
}

export interface PrivyWalletInfo {
  id: string;
  address: string;
  chainType: 'solana';
}

// Service class for Privy API interactions
export class PrivyTransactionService {
  private static readonly PRIVY_API_BASE = 'https://api.privy.io/v1';
  private static readonly SOLANA_CAIP2 = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';

  /**
   * Send a gasless transaction via Privy API
   */
  static async sendGaslessTransaction(
    request: PrivyTransactionRequest
  ): Promise<PrivyTransactionResponse> {
    try {
      console.log('Using new prepare-transaction endpoint');
      console.log('Request:', request);
      
      // First, prepare the transaction
      const prepareResponse = await fetch('/api/prepare-transaction?v=' + Date.now(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const prepareData = await prepareResponse.json();

      if (!prepareData.success) {
        return {
          success: false,
          error: prepareData.error || 'Failed to prepare transaction',
          sponsored: false,
        };
      }

      // For now, return success with the prepared transaction
      // In the next step, we'll implement client-side signing with Privy SDK
      return {
        success: true,
        transactionHash: null, // No real transaction hash yet
        sponsored: false,
        message: 'Transaction prepared successfully. Signing not yet implemented.'
      };
    } catch (error) {
      console.error('Privy transaction service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        sponsored: false,
      };
    }
  }

  /**
   * Get wallet information from Privy
   * This method requires server-side execution due to credentials
   */
  static async getWalletInfo(walletId: string): Promise<PrivyWalletInfo | null> {
    // This method should only be called from server-side code
    // For client-side usage, we'll assume the wallet is valid
    console.warn('getWalletInfo should be called from server-side only');
    return {
      id: walletId,
      address: walletId, // Assuming walletId is the address for now
      chainType: 'solana',
    };
  }

  /**
   * Validate if a transaction can be sponsored (gasless)
   * This is a client-side validation - server-side validation happens in API
   */
  static async canSponsorTransaction(
    walletId: string,
    amount: number,
    mint?: string
  ): Promise<{ canSponsor: boolean; reason?: string }> {
    try {
      // Basic client-side validation
      if (amount <= 0) {
        return { canSponsor: false, reason: 'Amount must be greater than 0' };
      }

      if (!walletId) {
        return { canSponsor: false, reason: 'Wallet ID is required' };
      }

      // For now, assume all valid requests can be sponsored
      // Server-side validation will handle the actual Privy API calls
      return { canSponsor: true };
    } catch (error) {
      console.error('Error validating sponsorship:', error);
      return { 
        canSponsor: false, 
        reason: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get transaction status from Privy
   */
  static async getTransactionStatus(
    walletId: string,
    transactionHash: string
  ): Promise<{ status: string; confirmations?: number; error?: string }> {
    try {
      const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
      const privyAppSecret = process.env.PRIVY_APP_SECRET;

      if (!privyAppId || !privyAppSecret) {
        throw new Error('Privy credentials not configured');
      }

      const response = await fetch(`${this.PRIVY_API_BASE}/wallets/${walletId}/rpc`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${privyAppId}:${privyAppSecret}`).toString('base64')}`,
          'privy-app-id': privyAppId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'getTransaction',
          caip2: this.SOLANA_CAIP2,
          params: [transactionHash, { encoding: 'json' }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction status');
      }

      const result = await response.json();
      
      if (result.error) {
        return { status: 'failed', error: result.error.message };
      }

      const transaction = result.result;
      if (!transaction) {
        return { status: 'pending' };
      }

      if (transaction.meta?.err) {
        return { status: 'failed', error: 'Transaction failed' };
      }

      return {
        status: 'confirmed',
        confirmations: transaction.meta?.confirmations || 0,
      };
    } catch (error) {
      console.error('Error fetching transaction status:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get Solscan URL for transaction
   */
  static getTransactionExplorerUrl(transactionHash: string): string {
    return `https://solscan.io/tx/${transactionHash}`;
  }

  /**
   * Get Solscan URL for wallet
   */
  static getWalletExplorerUrl(walletAddress: string): string {
    return `https://solscan.io/account/${walletAddress}`;
  }
}
