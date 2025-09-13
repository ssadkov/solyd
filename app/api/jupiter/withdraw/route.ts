import { NextRequest, NextResponse } from 'next/server'

interface WithdrawRequest {
  asset: string
  signer: string
  amount: string
}

interface JupiterWithdrawResponse {
  transaction: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WithdrawRequest = await request.json()
    
    // Validate required fields
    if (!body.asset || !body.signer || !body.amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: asset, signer, amount' 
        },
        { status: 400 }
      )
    }

    // Validate amount is positive
    const amount = parseFloat(body.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid amount. Must be a positive number.' 
        },
        { status: 400 }
      )
    }

    // Validate Solana address format (basic validation)
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    if (!solanaAddressRegex.test(body.asset) || !solanaAddressRegex.test(body.signer)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid Solana address format' 
        },
        { status: 400 }
      )
    }

    // Call Jupiter Lend API
    const jupiterResponse = await fetch('https://lite-api.jup.ag/lend/v1/earn/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        asset: body.asset,
        signer: body.signer,
        amount: body.amount,
      }),
    })

    if (!jupiterResponse.ok) {
      const errorText = await jupiterResponse.text()
      console.error('Jupiter Withdraw API error:', errorText)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Jupiter Withdraw API error: ${jupiterResponse.status} ${jupiterResponse.statusText}` 
        },
        { status: jupiterResponse.status }
      )
    }

    const jupiterData: JupiterWithdrawResponse = await jupiterResponse.json()

    if (!jupiterData.transaction) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No transaction returned from Jupiter Withdraw API' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: jupiterData.transaction,
        asset: body.asset,
        signer: body.signer,
        amount: body.amount,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Withdraw API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
