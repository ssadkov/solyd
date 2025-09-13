import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

interface UseWithdrawReturn {
  withdraw: (asset: string, amount: string) => Promise<string>
  isLoading: boolean
  error: string | null
}

export function useWithdraw(): UseWithdrawReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { publicKey, signTransaction } = useWallet()

  const executeWithdraw = async (asset: string, amount: string, retryCount = 0): Promise<string> => {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )

    try {
      // Step 1: Get fresh blockhash first
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      
      // Step 2: Get transaction from our API
      const response = await fetch('/api/jupiter/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset,
          signer: publicKey.toString(),
          amount,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create withdraw transaction')
      }

      // Step 3: Deserialize transaction
      const transactionBuffer = Buffer.from(data.data.transaction, 'base64')
      const transaction = Transaction.from(transactionBuffer)

      // Step 4: Update transaction with fresh blockhash and fee payer
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // Step 5: Simulate transaction before signing
      try {
        const simulation = await connection.simulateTransaction(transaction)
        if (simulation.value.err) {
          console.error('Transaction simulation failed:', simulation.value.err)
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`)
        }
      } catch (simErr) {
        console.error('Simulation error:', simErr)
        // Continue anyway, simulation might fail due to missing signatures
      }

      // Step 6: Sign transaction
      const signedTransaction = await signTransaction(transaction)

      // Step 7: Send transaction to Solana network
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Step 8: Confirm transaction with timeout
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed')

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
      }

      return signature

    } catch (err) {
      // Retry logic for specific errors
      if (retryCount < 2 && err instanceof Error) {
        if (err.message.includes('Blockhash not found') || 
            err.message.includes('expired') ||
            err.message.includes('Transaction simulation failed')) {
          console.log(`Retrying withdraw transaction (attempt ${retryCount + 1}/3)`)
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
          return executeWithdraw(asset, amount, retryCount + 1)
        }
      }
      
      throw err
    }
  }

  const withdraw = async (asset: string, amount: string): Promise<string> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const signature = await executeWithdraw(asset, amount)
      return signature

    } catch (err) {
      console.error('Withdraw error:', err)
      
      // Enhanced error handling for specific Solana errors
      let errorMessage = 'Withdraw failed'
      
      if (err instanceof Error) {
        if (err.message.includes('Blockhash not found') || err.message.includes('expired')) {
          errorMessage = 'Transaction expired. Please try again.'
        } else if (err.message.includes('Insufficient funds')) {
          errorMessage = 'Insufficient funds for this transaction.'
        } else if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled by user.'
        } else if (err.message.includes('simulation failed')) {
          errorMessage = 'Transaction simulation failed. Please check your balance and try again.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return { withdraw, isLoading, error }
}
