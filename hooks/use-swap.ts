import { useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction, TransactionInstruction, VersionedTransaction, AddressLookupTableAccount, TransactionMessage } from '@solana/web3.js'

interface JupiterQuoteRequest {
  inputMint: string
  outputMint: string
  amount: string
  slippageBps: number
}

interface JupiterQuoteResponse {
  inputMint: string
  inAmount: string
  outputMint: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  platformFee?: {
    amount: string
    feeBps: number
  }
  priceImpactPct: string
  routePlan: Array<{
    swapInfo: {
      ammKey: string
      label: string
      inputMint: string
      inAmount: string
      outputMint: string
      outAmount: string
      notEnoughLiquidity: boolean
      minInAmount: string
      minOutAmount: string
      priceImpactPct: string
      lpFee?: {
        amount: string
        mint: string
        pct: number
      }
      platformFee?: {
        amount: string
        mint: string
        pct: number
      }
    }
    percent: number
  }>
  contextSlot?: number
  timeTaken?: number
}

interface JupiterSwapInstructionsRequest {
  quoteResponse: JupiterQuoteResponse
  userPublicKey: string
  wrapAndUnwrapSol?: boolean
  useSharedAccounts?: boolean
  dynamicComputeUnitLimit?: boolean
  prioritizationFeeLamports?: string
}

interface JupiterSwapInstructionsResponse {
  setupInstructions?: any[]
  swapInstruction?: any
  cleanupInstruction?: any
  computeBudgetInstructions?: any[]
  otherInstructions?: any[]
  addressLookupTableAddresses?: string[]
}

// Десериализация инструкции Jupiter → web3.js TransactionInstruction
const deserializeInstruction = (ix: {
  programId: string
  accounts: { pubkey: string, isSigner: boolean, isWritable: boolean }[]
  data: string // base64
}) => new TransactionInstruction({
  programId: new PublicKey(ix.programId),
  keys: ix.accounts.map(a => ({
    pubkey: new PublicKey(a.pubkey),
    isSigner: a.isSigner,
    isWritable: a.isWritable,
  })),
  data: Buffer.from(ix.data, 'base64'),
})

// Получение Address Lookup Tables
const getAddressLookupTables = async (connection: Connection, addresses: string[]): Promise<AddressLookupTableAccount[]> => {
  if (!addresses || addresses.length === 0) return []
  
  const infos = await connection.getMultipleAccountsInfo(addresses.map(addr => new PublicKey(addr)))
  return infos.reduce<AddressLookupTableAccount[]>((acc, info, i) => {
    if (info) {
      try {
        acc.push(new AddressLookupTableAccount({
          key: new PublicKey(addresses[i]),
          state: AddressLookupTableAccount.deserialize(info.data),
        }))
      } catch (error) {
        console.warn(`Failed to deserialize ALT at index ${i}:`, error)
      }
    }
    return acc
  }, [])
}

interface UseSwapReturn {
  quote: JupiterQuoteResponse | null
  isLoading: boolean
  error: string | null
  getQuote: (request: JupiterQuoteRequest) => Promise<void>
  getSwapInstructions: (request: JupiterSwapInstructionsRequest) => Promise<JupiterSwapInstructionsResponse>
  executeSwap: (instructions: JupiterSwapInstructionsResponse, userPublicKey: string) => Promise<string>
  clearQuote: () => void
}

export function useSwap(): UseSwapReturn {
  const [quote, setQuote] = useState<JupiterQuoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { publicKey, signTransaction } = useWallet()

  const getQuote = useCallback(async (request: JupiterQuoteRequest) => {
    setIsLoading(true)
    setError(null)
    setQuote(null)

    try {
      const params = new URLSearchParams({
        inputMint: request.inputMint,
        outputMint: request.outputMint,
        amount: request.amount,
        slippageBps: request.slippageBps.toString(),
      })

      const response = await fetch(`https://quote-api.jup.ag/v6/quote?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to get quote: ${response.statusText}`)
      }

      const data = await response.json()
      setQuote(data)
    } catch (err) {
      console.error('Error getting quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to get quote')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getSwapInstructions = useCallback(async (request: JupiterSwapInstructionsRequest): Promise<JupiterSwapInstructionsResponse> => {
    try {
      const response = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: request.quoteResponse,
          userPublicKey: request.userPublicKey,
          wrapAndUnwrapSol: request.wrapAndUnwrapSol ?? true,
          useSharedAccounts: request.useSharedAccounts ?? true,
          dynamicComputeUnitLimit: request.dynamicComputeUnitLimit ?? true,
          prioritizationFeeLamports: request.prioritizationFeeLamports ?? "auto"
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get swap instructions: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Jupiter swap instructions response:', data)
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from Jupiter API')
      }
      
      // Check if we have the expected structure
      if (!data.setupInstructions && !data.swapInstruction && !data.cleanupInstruction) {
        console.error('Unexpected response structure:', data)
        throw new Error('Invalid swap instructions format')
      }
      
      return data
    } catch (err) {
      console.error('Error getting swap instructions:', err)
      throw err
    }
  }, [])

  const executeSwap = useCallback(async (instructions: JupiterSwapInstructionsResponse, userPublicKey: string): Promise<string> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )

    try {
      // Validate instructions
      if (!instructions) {
        throw new Error('No swap instructions received')
      }

      console.log('Processing swap instructions:', instructions)
      
      // Check if we have any instructions at all
      const hasAnyInstructions = 
        (instructions.setupInstructions && instructions.setupInstructions.length > 0) ||
        (instructions.computeBudgetInstructions && instructions.computeBudgetInstructions.length > 0) ||
        (instructions.otherInstructions && instructions.otherInstructions.length > 0) ||
        instructions.swapInstruction ||
        instructions.cleanupInstruction

      if (!hasAnyInstructions) {
        throw new Error('No valid instructions found in response')
      }
      
      // Step 1: Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      
      // Step 2: Get Address Lookup Tables
      const altAccounts = await getAddressLookupTables(connection, instructions.addressLookupTableAddresses || [])
      console.log('Loaded ALT accounts:', altAccounts.length)
      
      // Step 3: Prepare all instructions
      const allInstructions: TransactionInstruction[] = []
      
      try {
        if (instructions.setupInstructions && Array.isArray(instructions.setupInstructions) && instructions.setupInstructions.length > 0) {
          console.log('Adding setup instructions:', instructions.setupInstructions.length)
          instructions.setupInstructions.forEach((instruction: any, index: number) => {
            if (instruction && typeof instruction === 'object' && instruction.programId && instruction.accounts) {
              allInstructions.push(deserializeInstruction(instruction))
            } else {
              console.warn(`Invalid setup instruction at index ${index}:`, instruction)
            }
          })
        }
        
        if (instructions.computeBudgetInstructions && Array.isArray(instructions.computeBudgetInstructions) && instructions.computeBudgetInstructions.length > 0) {
          console.log('Adding compute budget instructions:', instructions.computeBudgetInstructions.length)
          instructions.computeBudgetInstructions.forEach((instruction: any, index: number) => {
            if (instruction && typeof instruction === 'object' && instruction.programId && instruction.accounts) {
              allInstructions.push(deserializeInstruction(instruction))
            } else {
              console.warn(`Invalid compute budget instruction at index ${index}:`, instruction)
            }
          })
        }
        
        if (instructions.otherInstructions && Array.isArray(instructions.otherInstructions) && instructions.otherInstructions.length > 0) {
          console.log('Adding other instructions:', instructions.otherInstructions.length)
          instructions.otherInstructions.forEach((instruction: any, index: number) => {
            if (instruction && typeof instruction === 'object' && instruction.programId && instruction.accounts) {
              allInstructions.push(deserializeInstruction(instruction))
            } else {
              console.warn(`Invalid other instruction at index ${index}:`, instruction)
            }
          })
        }
        
        if (instructions.swapInstruction) {
          console.log('Adding swap instruction')
          if (typeof instructions.swapInstruction === 'object' && instructions.swapInstruction.programId && instructions.swapInstruction.accounts) {
            allInstructions.push(deserializeInstruction(instructions.swapInstruction))
          } else {
            console.warn('Invalid swap instruction:', instructions.swapInstruction)
            throw new Error('Invalid swap instruction format')
          }
        }
        
        if (instructions.cleanupInstruction) {
          console.log('Adding cleanup instruction')
          if (typeof instructions.cleanupInstruction === 'object' && instructions.cleanupInstruction.programId && instructions.cleanupInstruction.accounts) {
            allInstructions.push(deserializeInstruction(instructions.cleanupInstruction))
          } else {
            console.warn('Invalid cleanup instruction:', instructions.cleanupInstruction)
            throw new Error('Invalid cleanup instruction format')
          }
        }
      } catch (instructionError) {
        console.error('Error preparing instructions:', instructionError)
        throw new Error(`Failed to prepare instructions: ${instructionError instanceof Error ? instructionError.message : 'Unknown error'}`)
      }

      // Step 4: Create Versioned Transaction
      const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(userPublicKey),
        recentBlockhash: blockhash,
        instructions: allInstructions,
      }).compileToV0Message(altAccounts)

      const transaction = new VersionedTransaction(messageV0)

      // Step 4: Simulate transaction
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

      // Step 5: Sign transaction
      const signedTransaction = await signTransaction(transaction)

      // Step 6: Send transaction
      const signature = await connection.sendTransaction(signedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Step 7: Confirm transaction
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
      console.error('Swap execution error:', err)
      
      // Enhanced error handling
      let errorMessage = 'Swap failed'
      
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
  }, [publicKey, signTransaction])

  const clearQuote = useCallback(() => {
    setQuote(null)
    setError(null)
  }, [])

  return {
    quote,
    isLoading,
    error,
    getQuote,
    getSwapInstructions,
    executeSwap,
    clearQuote,
  }
}
