'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SOLANA_CONFIG } from '@/lib/solana-config';

export interface TokenBalance {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  logo?: string;
}

export interface WalletBalance {
  sol: number;
  tokens: TokenBalance[];
  isLoading: boolean;
  error: string | null;
}

export function useWalletBalance(address: string | undefined) {
  const [balance, setBalance] = useState<WalletBalance>({
    sol: 0,
    tokens: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!address) {
      setBalance({ sol: 0, tokens: [], isLoading: false, error: null });
      return;
    }

    const fetchBalance = async () => {
      setBalance(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Validate address format
        if (!isValidSolanaAddress(address)) {
          throw new Error('Invalid Solana address format');
        }

        const connection = new Connection(SOLANA_CONFIG.rpcUrl, SOLANA_CONFIG.commitment);
        const publicKey = new PublicKey(address);

        // Get SOL balance
        const solBalance = await connection.getBalance(publicKey);
        const solAmount = solBalance / LAMPORTS_PER_SOL;

        // Get token accounts
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: new PublicKey(SOLANA_CONFIG.TOKEN_PROGRAM_ID),
        });

        // Process token balances
        const tokens: TokenBalance[] = [];
        
        for (const account of tokenAccounts.value) {
          const parsedInfo = account.account.data.parsed.info;
          const tokenAmount = parsedInfo.tokenAmount;
          
          // Only include tokens with balance > 0
          if (tokenAmount.uiAmount > 0) {
            const mint = parsedInfo.mint;
            let symbol = getTokenSymbol(mint);
            
            // If not in our predefined list, try to get from RPC
            if (!symbol) {
              try {
                symbol = await getTokenMetadata(connection, mint);
              } catch (error) {
                console.warn(`Failed to get metadata for token ${mint}:`, error);
              }
            }
            
            // Try to get token logo
            let logo: string | undefined;
            try {
              logo = await getTokenLogo(connection, mint);
            } catch (error) {
              console.warn(`Failed to get logo for token ${mint}:`, error);
            }
            
            tokens.push({
              mint,
              amount: tokenAmount.amount,
              decimals: tokenAmount.decimals,
              uiAmount: tokenAmount.uiAmount,
              symbol,
              logo,
            });
          }
        }

        setBalance({
          sol: solAmount,
          tokens,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        setBalance(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch balance',
        }));
      }
    };

    fetchBalance();
  }, [address]);

  return balance;
}

// Helper function to get token logo from Metaplex metadata
async function getTokenLogo(connection: Connection, mint: string): Promise<string | undefined> {
  try {
    // Metaplex Token Metadata Program ID
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    
    // Find metadata PDA
    const [metadataPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        new PublicKey(mint).toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    // Get metadata account
    const metadataAccount = await connection.getAccountInfo(metadataPDA);
    if (!metadataAccount) return undefined;

    // Parse metadata (simplified - in production you'd use proper deserialization)
    const data = metadataAccount.data;
    const uriOffset = 1 + 32 + 32 + 4 + 4 + 4 + 4 + 4; // Skip to URI field
    const uriLength = data.readUInt32LE(uriOffset);
    const uri = data.slice(uriOffset + 4, uriOffset + 4 + uriLength).toString();
    
    // Fetch metadata JSON
    const response = await fetch(uri);
    const metadata = await response.json();
    
    return metadata.image;
  } catch (error) {
    console.warn(`Error getting logo for ${mint}:`, error);
    return undefined;
  }
}

// Helper function to get token metadata from RPC
async function getTokenMetadata(connection: Connection, mint: string): Promise<string | undefined> {
  try {
    // Try to get token metadata using getAccountInfo
    const mintAccount = await connection.getAccountInfo(new PublicKey(mint));
    if (!mintAccount) return undefined;
    
    // For now, we'll use a simple approach - try to get from known token lists
    // In a real app, you might want to use Jupiter API or other token metadata services
    const knownTokens: Record<string, string> = {
      // Add more known tokens here
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
      'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': 'SRM',
      'So11111111111111111111111111111111111111112': 'SOL',
    };
    
    return knownTokens[mint];
  } catch (error) {
    console.warn(`Error getting metadata for ${mint}:`, error);
    return undefined;
  }
}

// Helper function to validate Solana address
function isValidSolanaAddress(address: string): boolean {
  try {
    // Basic validation - Solana addresses are base58 encoded and 32-44 characters
    if (address.length < 32 || address.length > 44) {
      return false;
    }
    
    // Check if it's base58 (no 0, O, I, l characters)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(address);
  } catch {
    return false;
  }
}

// Helper function to get token symbol
function getTokenSymbol(mint: string): string | undefined {
  const tokenMap: Record<string, string> = {
    [SOLANA_CONFIG.POPULAR_TOKENS.SOL]: 'SOL',
    [SOLANA_CONFIG.POPULAR_TOKENS.USDC]: 'USDC',
    [SOLANA_CONFIG.POPULAR_TOKENS.USDT]: 'USDT',
    [SOLANA_CONFIG.POPULAR_TOKENS.RAY]: 'RAY',
    [SOLANA_CONFIG.POPULAR_TOKENS.SRM]: 'SRM',
    [SOLANA_CONFIG.POPULAR_TOKENS.BONK]: 'BONK',
    [SOLANA_CONFIG.POPULAR_TOKENS.WIF]: 'WIF',
    [SOLANA_CONFIG.POPULAR_TOKENS.ORCA]: 'ORCA',
    [SOLANA_CONFIG.POPULAR_TOKENS.JUP]: 'JUP',
    [SOLANA_CONFIG.POPULAR_TOKENS.PYTH]: 'PYTH',
  };
  
  return tokenMap[mint];
}
