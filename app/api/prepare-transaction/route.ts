import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SOLANA_CONFIG } from '@/lib/solana-config';

interface PrepareTransactionRequest {
  walletId: string;
  recipient: string;
  amount: number;
  mint?: string; // For SPL tokens, undefined for SOL
  decimals?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { walletId, recipient, amount, mint, decimals = 9 }: PrepareTransactionRequest = await request.json();

    // Validate required fields
    if (!walletId || !recipient || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: walletId, recipient, amount'
      }, { status: 400 });
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than 0'
      }, { status: 400 });
    }

    // Validate Solana addresses
    try {
      new PublicKey(recipient);
      new PublicKey(walletId);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid Solana address format'
      }, { status: 400 });
    }

    // Create transaction
    const connection = new Connection(SOLANA_CONFIG.rpcUrl, SOLANA_CONFIG.commitment);
    const fromPublicKey = new PublicKey(walletId);
    const toPublicKey = new PublicKey(recipient);

    let transaction: Transaction;

    if (mint) { // SPL Token transfer
      const mintPublicKey = new PublicKey(mint);
      const senderTokenAccount = await getAssociatedTokenAddress(mintPublicKey, fromPublicKey);
      const recipientTokenAccount = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);

      transaction = new Transaction().add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          fromPublicKey,
          amount * (10 ** decimals), // Convert to token units
          [],
          TOKEN_PROGRAM_ID
        )
      );
    } else { // SOL transfer
      transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: amount * LAMPORTS_PER_SOL,
        })
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

    console.log('Transaction prepared successfully');
    console.log('Base64 transaction length:', base64Transaction.length);

    return NextResponse.json({
      success: true,
      serializedTransaction: base64Transaction,
      message: 'Transaction ready for signing'
    });

  } catch (error: any) {
    console.error('Prepare transaction error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to prepare transaction'
    }, { status: 500 });
  }
}
