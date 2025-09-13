'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SOLANA_CONFIG } from '@/lib/solana-config';
import { JupiterPriceService } from '@/services/jupiter-price.service';

export interface TokenBalance {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  logo?: string;
  // Jupiter Price API data
  usdPrice?: number;
  usdValue?: number;
  priceChange24h?: number;
  blockId?: number;
}

export interface WalletBalance {
  sol: number;
  tokens: TokenBalance[];
  isLoading: boolean;
  error: string | null;
  // USD values
  solUsdPrice?: number;
  solUsdValue?: number;
  solPriceChange24h?: number;
  totalUsdValue?: number;
}

export function useWalletBalance(address: string | undefined) {
  const [balance, setBalance] = useState<WalletBalance>({
    sol: 0,
    tokens: [],
    isLoading: false,
    error: null,
    solUsdPrice: undefined,
    solUsdValue: undefined,
    solPriceChange24h: undefined,
    totalUsdValue: undefined,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!address) {
      setBalance({ 
        sol: 0, 
        tokens: [], 
        isLoading: false, 
        error: null,
        solUsdPrice: undefined,
        solUsdValue: undefined,
        solPriceChange24h: undefined,
        totalUsdValue: undefined,
      });
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
              console.log(`Logo for ${mint}:`, logo);
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

        // Получаем цены для всех токенов + SOL
        const allMints = [
          'So11111111111111111111111111111111111111112', // SOL
          ...tokens.map(token => token.mint)
        ];

        let priceData: Record<string, any> = {};
        try {
          priceData = await JupiterPriceService.getPrices(allMints);
          console.log('Price data received:', priceData);
        } catch (error) {
          console.warn('Failed to fetch prices from Jupiter API:', error);
        }

        // Обновляем токены с ценовой информацией
        const tokensWithPrices = tokens.map(token => {
          const priceInfo = priceData[token.mint];
          if (priceInfo) {
            return {
              ...token,
              usdPrice: priceInfo.usdPrice,
              usdValue: token.uiAmount * priceInfo.usdPrice,
              priceChange24h: priceInfo.priceChange24h,
              blockId: priceInfo.blockId,
            };
          }
          return token;
        });

        // Получаем данные для SOL
        const solPriceInfo = priceData['So11111111111111111111111111111111111111112'];
        const solUsdPrice = solPriceInfo?.usdPrice;
        const solUsdValue = solUsdPrice ? solAmount * solUsdPrice : undefined;
        const solPriceChange24h = solPriceInfo?.priceChange24h;

        // Рассчитываем общую стоимость портфеля
        const tokensValue = tokensWithPrices.reduce((sum, token) => sum + (token.usdValue || 0), 0);
        const totalUsdValue = (solUsdValue || 0) + tokensValue;
        
        console.log('Balance calculation:', {
          solUsdValue,
          tokensValue,
          totalUsdValue,
          tokensWithPrices: tokensWithPrices.map(t => ({ symbol: t.symbol, usdValue: t.usdValue }))
        });

        setBalance({
          sol: solAmount,
          tokens: tokensWithPrices,
          isLoading: false,
          error: null,
          solUsdPrice,
          solUsdValue,
          solPriceChange24h,
          totalUsdValue,
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
  }, [address, refreshTrigger]);

  const refreshBalance = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return { ...balance, refreshBalance };
}

// Helper function to get token logo
async function getTokenLogo(connection: Connection, mint: string): Promise<string | undefined> {
  try {
    // First, try to get from known popular tokens
    const popularTokenLogos: Record<string, string> = {
      'So11111111111111111111111111111111111111112': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png', // USDT
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png', // RAY
      'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png', // SRM
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png', // BONK
      'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm/logo.png', // WIF
      'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png', // ORCA
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png', // JUP
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png', // PYTH
    };

    if (popularTokenLogos[mint]) {
      return popularTokenLogos[mint];
    }

    // If not in popular tokens, try Metaplex metadata
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
