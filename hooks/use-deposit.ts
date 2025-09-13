import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

interface UseDepositReturn {
  deposit: (asset: string, amount: string) => Promise<string>
  getDepositInstructions: (asset: string, amount: string, signer: string) => Promise<any>
  isLoading: boolean
  error: string | null
}

export function useDeposit(): UseDepositReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { publicKey, signTransaction } = useWallet()

  const getDepositInstructions = async (asset: string, amount: string, signer: string): Promise<any> => {
    try {
      // Validate parameters
      if (!asset || !amount || !signer) {
        throw new Error('Missing required parameters: asset, amount, signer')
      }

      // Validate Solana address format
      const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      if (!solanaAddressRegex.test(asset) || !solanaAddressRegex.test(signer)) {
        throw new Error('Invalid Solana address format')
      }

      // Validate amount is a positive integer string (base units)
      const amountStr = amount.toString().trim()
      if (!/^\d+$/.test(amountStr)) {
        throw new Error('Invalid amount - must be a positive integer string (base units)')
      }

      const amountNum = parseInt(amountStr)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount - must be a positive integer')
      }

      console.log('Requesting deposit instructions:', {
        asset,
        amount: amountStr,
        signer,
        amountType: typeof amountStr,
        amountValue: amountNum,
        note: 'Amount in base units (no decimal point)'
      })

      const response = await fetch('https://lite-api.jup.ag/lend/v1/earn/deposit-instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          asset,
          signer,
          amount: amountStr, // Send as integer string in base units
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Jupiter deposit instructions API error:', errorText)
        throw new Error(`Failed to get deposit instructions: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Jupiter deposit instructions response:', data)
      
      return data
    } catch (err) {
      console.error('Error getting deposit instructions:', err)
      throw err
    }
  }

  const deposit = async (asset: string, amount: string): Promise<string> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )

    try {
      // Step 1: Get fresh blockhash first
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      
      // Step 2: Get transaction from our API
      const response = await fetch('/api/jupiter/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset,
          signer: publicKey!.toString(),
          amount,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create deposit transaction')
      }

      // Step 3: Deserialize transaction
      const transactionBuffer = Buffer.from(data.data.transaction, 'base64')
      const transaction = Transaction.from(transactionBuffer)

      // Step 4: Update transaction with fresh blockhash and fee payer
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!

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
      const signedTransaction = await signTransaction!(transaction)

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
      console.error('Deposit error:', err)
      
      // Enhanced error handling for specific Solana errors
      let errorMessage = 'Deposit failed'
      
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

  return { deposit, getDepositInstructions, isLoading, error }
}
