import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

interface UseDepositReturn {
  deposit: (asset: string, amount: string) => Promise<string>
  isLoading: boolean
  error: string | null
}

export function useDeposit(): UseDepositReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { publicKey, signTransaction } = useWallet()

  const deposit = async (asset: string, amount: string): Promise<string> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Get transaction from our API
      const response = await fetch('/api/jupiter/deposit', {
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
        throw new Error(data.error || 'Failed to create deposit transaction')
      }

      // Step 2: Deserialize transaction
      const transactionBuffer = Buffer.from(data.data.transaction, 'base64')
      const transaction = Transaction.from(transactionBuffer)

      // Step 3: Sign transaction
      const signedTransaction = await signTransaction(transaction)

      // Step 4: Send transaction to Solana network
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      )

      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      // Step 5: Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed')

      return signature

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deposit failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { deposit, isLoading, error }
}
