import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { SOLANA_CONFIG } from '@/lib/solana-config';

// Types
interface SendTransactionRequest {
  walletId: string;
  recipient: string;
  amount: number;
  mint?: string; // For SPL tokens, undefined for SOL
  decimals?: number;
}

interface SendTransactionResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  sponsored: boolean;
}

// Helper function to create authorization signature
async function createAuthorizationSignature(walletId: string, timestamp: string): Promise<string> {
  // In production, you should implement proper signature creation
  // This is a simplified version for development
  const message = `${walletId}:${timestamp}`;
  return Buffer.from(message).toString('base64');
}

// Helper function to create SOL transfer transaction
async function createSOLTransferTransaction(
  from: PublicKey,
  to: PublicKey,
  amount: number
): Promise<Transaction> {
  const transaction = new Transaction();
  
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    })
  );

  return transaction;
}

// Helper function to create SPL token transfer transaction
async function createSPLTokenTransferTransaction(
  from: PublicKey,
  to: PublicKey,
  mint: PublicKey,
  amount: number,
  decimals: number
): Promise<Transaction> {
  const connection = new Connection(SOLANA_CONFIG.rpcUrl, SOLANA_CONFIG.commitment);
  
  // Get associated token addresses
  const fromTokenAccount = await getAssociatedTokenAddress(mint, from);
  const toTokenAccount = await getAssociatedTokenAddress(mint, to);

  const transaction = new Transaction();
  
  // Add transfer instruction
  transaction.add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      from,
      Math.floor(amount * Math.pow(10, decimals))
    )
  );

  return transaction;
}

export async function POST(request: NextRequest): Promise<NextResponse<SendTransactionResponse>> {
  try {
    const { walletId, recipient, amount, mint, decimals = 9 }: SendTransactionRequest = await request.json();

    // Validate required fields
    if (!walletId || !recipient || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: walletId, recipient, amount',
        sponsored: false
      }, { status: 400 });
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than 0',
        sponsored: false
      }, { status: 400 });
    }

    // Validate Solana addresses
    try {
      new PublicKey(recipient);
      new PublicKey(walletId);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid Solana address format',
        sponsored: false
      }, { status: 400 });
    }

    // Get Privy credentials
    const privyAppId = process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const privyAppSecret = process.env.PRIVY_APP_SECRET;

    console.log('Privy App ID:', privyAppId ? 'Found' : 'Missing');
    console.log('Privy App Secret:', privyAppSecret ? 'Found' : 'Missing');
    
    if (!privyAppId || !privyAppSecret) {
      return NextResponse.json({
        success: false,
        error: `Privy credentials not configured. App ID: ${privyAppId ? 'Found' : 'Missing'}, Secret: ${privyAppSecret ? 'Found' : 'Missing'}`,
        sponsored: false
      }, { status: 500 });
    }

    // Create transaction
    const connection = new Connection(SOLANA_CONFIG.rpcUrl, SOLANA_CONFIG.commitment);
    const fromPublicKey = new PublicKey(walletId);
    const toPublicKey = new PublicKey(recipient);

    let transaction: Transaction;
    
    if (mint) {
      // SPL token transfer
      const mintPublicKey = new PublicKey(mint);
      transaction = await createSPLTokenTransferTransaction(
        fromPublicKey,
        toPublicKey,
        mintPublicKey,
        amount,
        decimals
      );
    } else {
      // SOL transfer
      transaction = await createSOLTransferTransaction(
        fromPublicKey,
        toPublicKey,
        amount
      );
    }

    // Get recent blockhash with retry logic
    let blockhash;
    try {
      const blockhashResult = await connection.getLatestBlockhash();
      blockhash = blockhashResult.blockhash;
    } catch (error) {
      console.error('Failed to get blockhash from primary RPC:', error);
      // Try with a different RPC endpoint as fallback
      const fallbackConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const fallbackResult = await fallbackConnection.getLatestBlockhash();
      blockhash = fallbackResult.blockhash;
    }
    
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Serialize transaction to base64
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    const base64Transaction = serializedTransaction.toString('base64');

    // Send transaction via Privy API with gasless sponsorship
    console.log('Sending to Privy API...');
    console.log('Wallet ID:', walletId);
    console.log('App ID:', privyAppId);
    console.log('App Secret length:', privyAppSecret?.length);
    
    const requestBody = {
      method: 'signAndSendTransaction',
      caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Solana mainnet
      params: [base64Transaction, { encoding: 'base64' }]
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Try different endpoint format for Solana
    const privyResponse = await fetch(`https://api.privy.io/v1/wallets/${walletId}/rpc`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${privyAppId}:${privyAppSecret}`).toString('base64')}`,
        'privy-app-id': privyAppId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Privy response status:', privyResponse.status);
    console.log('Privy response headers:', Object.fromEntries(privyResponse.headers.entries()));
    
    if (!privyResponse.ok) {
      const errorData = await privyResponse.text();
      console.error('Privy API error:', errorData);
      
      return NextResponse.json({
        success: false,
        error: `Transaction failed: ${errorData}`,
        sponsored: false
      }, { status: 500 });
    }

    const privyResult = await privyResponse.json();
    
    if (privyResult.error) {
      return NextResponse.json({
        success: false,
        error: `Transaction failed: ${privyResult.error.message || 'Unknown error'}`,
        sponsored: false
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transactionHash: privyResult.result,
      sponsored: true
    });

  } catch (error) {
    console.error('Send transaction error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      sponsored: false
    }, { status: 500 });
  }
}
