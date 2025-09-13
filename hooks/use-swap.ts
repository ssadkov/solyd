import { useState, useCallback } from 'react'

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

interface UseSwapReturn {
  quote: JupiterQuoteResponse | null
  isLoading: boolean
  error: string | null
  getQuote: (request: JupiterQuoteRequest) => Promise<void>
  clearQuote: () => void
}

export function useSwap(): UseSwapReturn {
  const [quote, setQuote] = useState<JupiterQuoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const clearQuote = useCallback(() => {
    setQuote(null)
    setError(null)
  }, [])

  return {
    quote,
    isLoading,
    error,
    getQuote,
    clearQuote,
  }
}
