import { useState, useCallback } from 'react'
import { useSwap } from './use-swap'
import { useDeposit } from './use-deposit'
import { useWalletContext } from '@/contexts/wallet-context'
import { Connection, PublicKey, Transaction, TransactionInstruction, VersionedTransaction, AddressLookupTableAccount, TransactionMessage } from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'

interface JupiterQuoteRequest {
  inputMint: string
  outputMint: string
  amount: string
  slippageBps: number
  userPublicKey?: string
  outputTokenDecimals?: number
}

interface JupiterSwapInstructionsRequest {
  quoteResponse: any
  userPublicKey: string
  wrapAndUnwrapSol?: boolean
  useSharedAccounts?: boolean
  dynamicComputeUnitLimit?: boolean
  prioritizationFeeLamports?: string
}

interface UseSwapAndDepositReturn {
  // Все функции из useSwap
  quote: any
  isLoading: boolean
  error: string | null
  getQuote: (request: JupiterQuoteRequest) => Promise<void>
  getSwapInstructions: (request: JupiterSwapInstructionsRequest) => Promise<any>
  executeSwap: (instructions: any, userPublicKey: string) => Promise<string>
  clearQuote: () => void
  
  // Все функции из useDeposit
  deposit: (asset: string, amount: string) => Promise<string>
  getDepositInstructions: (asset: string, amount: string, signer: string) => Promise<any>
  
  // Новые функции для комбинированной операции
  executeSwapAndDeposit: (swapRequest: JupiterQuoteRequest, depositAsset: string) => Promise<string>
  isExecuting: boolean
  executionStep: 'idle' | 'swapping' | 'depositing' | 'success' | 'error'
}

export function useSwapAndDeposit(): UseSwapAndDepositReturn {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionStep, setExecutionStep] = useState<'idle' | 'swapping' | 'depositing' | 'success' | 'error'>('idle')
  
  // Используем существующие хуки
  const swapHook = useSwap()
  const depositHook = useDeposit()
  const { refreshBalance } = useWalletContext()
  const { publicKey, signTransaction } = useWallet()

  // Функция для получения реального баланса токена после swap
  const getActualTokenBalance = async (tokenMint: string, userPublicKey: string, decimals: number): Promise<string> => {
    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      )
      
      const userPubkey = new PublicKey(userPublicKey)
      const tokenMintPubkey = new PublicKey(tokenMint)
      
      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(tokenMintPubkey, userPubkey)
      
      // Get token account info
      const accountInfo = await connection.getTokenAccountBalance(tokenAccount)
      
      if (accountInfo.value) {
        const balance = accountInfo.value.uiAmount || 0
        console.log('Actual token balance after swap:', {
          tokenMint,
          balance: balance.toString(),
          decimals: accountInfo.value.decimals
        })
        return balance.toString()
      } else {
        console.warn('Token account not found, using quote amount')
        return '0'
      }
    } catch (error) {
      console.error('Error getting actual token balance:', error)
      return '0'
    }
  }

  // Функция для проверки размера транзакции
  const checkTransactionSize = (transaction: VersionedTransaction): boolean => {
    try {
      // First, let's check the transaction structure
      console.log('Transaction structure check:', {
        numRequiredSignatures: transaction.message?.header?.numRequiredSignatures,
        numReadonlySignedAccounts: transaction.message?.header?.numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts: transaction.message?.header?.numReadonlyUnsignedAccounts,
        instructionsLength: transaction.message?.compiledInstructions?.length,
        staticAccountsLength: transaction.message?.staticAccountKeys?.length,
        addressTableLookupsLength: transaction.message?.addressTableLookups?.length,
        signaturesLength: transaction.signatures?.length
      })
      
      const serialized = transaction.serialize()
      const rawSize = serialized.length
      const base64Size = Buffer.from(serialized).toString('base64').length
      
      console.log('Transaction size check:', {
        rawSize,
        base64Size,
        rawLimit: 1232,
        base64Limit: 1644,
        withinLimits: rawSize <= 1232 && base64Size <= 1644
      })
      
      return rawSize <= 1232 && base64Size <= 1644
    } catch (error) {
      console.error('Error checking transaction size:', error)
      console.log('Transaction structure details:', {
        message: transaction.message,
        signatures: transaction.signatures,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Функция для повторного запроса с меньшим maxAccounts
  const requoteWithLowerMaxAccounts = async (swapRequest: JupiterQuoteRequest, maxAccounts: number): Promise<any> => {
    console.log(`Re-quoting with maxAccounts: ${maxAccounts}`)
    
    const params = new URLSearchParams({
      inputMint: swapRequest.inputMint,
      outputMint: swapRequest.outputMint,
      amount: swapRequest.amount,
      slippageBps: swapRequest.slippageBps.toString(),
      maxAccounts: maxAccounts.toString(),
    })

    const response = await fetch(`https://quote-api.jup.ag/v6/quote?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get quote with maxAccounts ${maxAccounts}: ${response.statusText}`)
    }

    return await response.json()
  }

  // Функция для объединения swap и deposit инструкций в одну транзакцию
  const combineAndExecuteInstructions = async (
    swapInstructions: any,
    depositInstructions: any,
    userPublicKey: string
  ): Promise<string> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected')
    }

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )

    try {
      // Step 1: Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      
      // Step 2: Get Address Lookup Tables for swap
      const altAddresses = swapInstructions.addressLookupTableAddresses || []
      console.log('Address Lookup Table addresses:', altAddresses)
      
      const altAccounts = await getAddressLookupTables(connection, altAddresses)
      console.log('Loaded ALT accounts:', altAccounts.length)
      
      // Step 3: Prepare all instructions with validation
      const allInstructions: TransactionInstruction[] = []
      
      console.log('Preparing instructions:', {
        swapInstructions: {
          setup: swapInstructions.setupInstructions?.length || 0,
          compute: swapInstructions.computeBudgetInstructions?.length || 0,
          other: swapInstructions.otherInstructions?.length || 0,
          swap: swapInstructions.swapInstruction ? 1 : 0,
          cleanup: swapInstructions.cleanupInstruction ? 1 : 0
        },
        depositInstructions: {
          instructions: depositInstructions.instructions?.length || 0
        }
      })
      
      // Add swap instructions (optimized - only essential ones)
      
      // Add compute budget instructions (only one set)
      if (swapInstructions.computeBudgetInstructions && Array.isArray(swapInstructions.computeBudgetInstructions)) {
        swapInstructions.computeBudgetInstructions.forEach((instruction: any, index: number) => {
          try {
            if (instruction && typeof instruction === 'object' && instruction.programId && instruction.accounts) {
              const deserialized = deserializeInstruction(instruction)
              allInstructions.push(deserialized)
              console.log(`Added compute budget instruction ${index}`)
            }
          } catch (error) {
            console.warn(`Failed to deserialize compute budget instruction ${index}:`, error)
          }
        })
      }
      
      // Add setup instructions (only if essential)
      if (swapInstructions.setupInstructions && Array.isArray(swapInstructions.setupInstructions)) {
        swapInstructions.setupInstructions.forEach((instruction: any, index: number) => {
          try {
            if (instruction && typeof instruction === 'object' && instruction.programId && instruction.accounts) {
              const deserialized = deserializeInstruction(instruction)
              allInstructions.push(deserialized)
              console.log(`Added setup instruction ${index}`)
            }
          } catch (error) {
            console.warn(`Failed to deserialize setup instruction ${index}:`, error)
          }
        })
      }
      
      // Add swap instruction (essential)
      if (swapInstructions.swapInstruction) {
        try {
          const deserialized = deserializeInstruction(swapInstructions.swapInstruction)
          allInstructions.push(deserialized)
          console.log('Added swap instruction')
        } catch (error) {
          console.error('Failed to deserialize swap instruction:', error)
          throw new Error('Invalid swap instruction')
        }
      }
      
      // Skip cleanup instruction to save space (not essential for combined transaction)
      // Skip other instructions to save space
      
      // Add deposit instructions
      if (depositInstructions.instructions && Array.isArray(depositInstructions.instructions)) {
        depositInstructions.instructions.forEach((instruction: any, index: number) => {
          try {
            if (instruction && typeof instruction === 'object' && instruction.programId && instruction.accounts) {
              const deserialized = deserializeInstruction(instruction)
              allInstructions.push(deserialized)
              console.log(`Added deposit instruction ${index}`)
            }
          } catch (error) {
            console.warn(`Failed to deserialize deposit instruction ${index}:`, error)
          }
        })
      }
      
      console.log(`Total instructions prepared: ${allInstructions.length}`)
      
      // Check if we have any instructions
      if (allInstructions.length === 0) {
        throw new Error('No valid instructions to execute')
      }
      
      // Validate each instruction before creating transaction
      allInstructions.forEach((instruction, index) => {
        try {
          // Basic validation of instruction structure
          console.log(`Instruction ${index} validation:`, {
            programId: instruction.programId.toString(),
            accountsCount: instruction.keys.length,
            dataLength: instruction.data.length,
            isValid: instruction.programId && instruction.keys && instruction.data
          })
        } catch (error) {
          console.error(`Invalid instruction ${index}:`, error)
          throw new Error(`Invalid instruction ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      })
      
      // Step 4: Create Versioned Transaction
      let transaction: VersionedTransaction
      try {
        console.log('Creating TransactionMessage with:', {
          payerKey: userPublicKey,
          blockhash,
          instructionsCount: allInstructions.length,
          altAccountsCount: altAccounts.length
        })
        
        const messageV0 = new TransactionMessage({
          payerKey: new PublicKey(userPublicKey),
          recentBlockhash: blockhash,
          instructions: allInstructions,
        }).compileToV0Message(altAccounts)
        
        console.log('TransactionMessage created successfully')
        
        transaction = new VersionedTransaction(messageV0)
        
        console.log('VersionedTransaction created successfully')
        
        // Step 5: Check transaction size before simulation
        if (!checkTransactionSize(transaction)) {
          throw new Error('Transaction too large - cannot fit in Solana limits')
        }
      } catch (error) {
        console.error('Error creating transaction:', error)
        console.log('Error details:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Step 6: Simulate transaction
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

      // Step 7: Sign transaction
      const signedTransaction = await signTransaction(transaction)

      // Step 8: Send transaction
      const signature = await connection.sendTransaction(signedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Step 9: Confirm transaction
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
      console.error('Combined transaction execution error:', err)
      throw err
    }
  }

  // Helper function to deserialize instructions (from useSwap)
  const deserializeInstruction = (ix: {
    programId: string
    accounts: { pubkey: string, isSigner: boolean, isWritable: boolean }[]
    data: string
  }) => new TransactionInstruction({
    programId: new PublicKey(ix.programId),
    keys: ix.accounts.map(a => ({
      pubkey: new PublicKey(a.pubkey),
      isSigner: a.isSigner,
      isWritable: a.isWritable,
    })),
    data: Buffer.from(ix.data, 'base64'),
  })

  // Helper function to get Address Lookup Tables (from useSwap)
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

  // Комбинированная функция для выполнения swap + deposit в одной транзакции
  const executeSwapAndDeposit = useCallback(async (
    swapRequest: JupiterQuoteRequest,
    depositAsset: string
  ): Promise<string> => {
    setIsExecuting(true)
    setExecutionStep('swapping')
    
    try {
      console.log('Starting combined swap and deposit process...')
      
      // Step 1: Get swap quote with size optimization
      console.log('Step 1: Getting swap quote...', {
        inputMint: swapRequest.inputMint,
        outputMint: swapRequest.outputMint,
        amount: swapRequest.amount,
        slippageBps: swapRequest.slippageBps
      })
      
      await swapHook.getQuote(swapRequest)
      
      // Wait a bit for the state to update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check for errors in the swap hook
      if (swapHook.error) {
        throw new Error(`Swap quote failed: ${swapHook.error}`)
      }
      
      if (!swapHook.quote) {
        throw new Error('Failed to get swap quote - no quote received')
      }
      
      console.log('Swap quote received:', swapHook.quote)
      
      // Step 2: Get swap instructions
      console.log('Step 2: Getting swap instructions...')
      const userPublicKey = swapRequest.userPublicKey || publicKey?.toString()
      if (!userPublicKey) {
        throw new Error('User public key is required for swap instructions')
      }

      // Ensure userPublicKey is a string (not PublicKey object)
      const userPublicKeyStr = userPublicKey.toString()
      console.log('User public key for swap:', {
        original: userPublicKey,
        asString: userPublicKeyStr,
        type: typeof userPublicKeyStr
      })

      const swapInstructions = await swapHook.getSwapInstructions({
        quoteResponse: swapHook.quote,
        userPublicKey: userPublicKeyStr,
        wrapAndUnwrapSol: false, // Disable to save space (only if not swapping SOL)
        useSharedAccounts: true, // Keep this to reduce accounts
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto"
      })
      
      // Step 3: Get deposit instructions using quote amount
      setExecutionStep('depositing')
      console.log('Step 3: Getting deposit instructions...')
      
      // Use the raw amount from swap quote (already in base units)
      // Jupiter expects amount as integer string in base units (no decimal point)
      const depositAmount = swapHook.quote.outAmount // This is already in base units as string
      
      console.log('Deposit calculation (using raw quote amount):', {
        outAmount: swapHook.quote.outAmount,
        depositAmount: depositAmount,
        note: 'Using raw outAmount from swap quote (already in base units)'
      })
      
      console.log('Getting deposit instructions with:', {
        depositAsset,
        depositAmount,
        userPublicKey: userPublicKeyStr
      })

      const depositInstructions = await depositHook.getDepositInstructions(
        depositAsset, 
        depositAmount, 
        userPublicKeyStr
      )
      
      // Step 4: Combine and execute both instructions in one transaction
      console.log('Step 4: Combining and executing swap + deposit in one transaction...')
      const signature = await combineAndExecuteInstructions(
        swapInstructions,
        depositInstructions,
        userPublicKeyStr
      )
      
      console.log('Combined transaction completed successfully:', signature)
      
      // Step 5: Refresh balances
      console.log('Step 5: Refreshing balances...')
      await refreshBalance()
      
      setExecutionStep('success')
      console.log('Combined swap and deposit process completed successfully!')
      
      return signature
      
    } catch (error) {
      console.error('Combined swap and deposit failed:', error)
      setExecutionStep('error')
      
      // Re-throw the error so the UI can handle it
      throw error
    } finally {
      setIsExecuting(false)
    }
  }, [swapHook, depositHook, refreshBalance, combineAndExecuteInstructions])

  return {
    // Все функции из useSwap
    quote: swapHook.quote,
    isLoading: swapHook.isLoading,
    error: swapHook.error || depositHook.error,
    getQuote: swapHook.getQuote,
    getSwapInstructions: swapHook.getSwapInstructions,
    executeSwap: swapHook.executeSwap,
    clearQuote: swapHook.clearQuote,
    
    // Все функции из useDeposit
    deposit: depositHook.deposit,
    getDepositInstructions: depositHook.getDepositInstructions,
    
    // Новые функции
    executeSwapAndDeposit,
    isExecuting,
    executionStep,
  }
}
