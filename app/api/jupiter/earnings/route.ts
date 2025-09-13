import { NextRequest, NextResponse } from 'next/server'
import { jupiterService } from '@/services/jupiter.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('address')
    const positions = searchParams.get('positions')

    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet address is required',
          message: 'Please provide a wallet address as query parameter',
        },
        { status: 400 }
      )
    }

    if (!positions) {
      return NextResponse.json(
        {
          success: false,
          error: 'Positions are required',
          message: 'Please provide positions as comma-separated addresses',
        },
        { status: 400 }
      )
    }

    // Парсим адреса позиций
    const positionAddresses = positions.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0)

    if (positionAddresses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid positions provided',
          message: 'Please provide at least one valid position address',
        },
        { status: 400 }
      )
    }

    // Получаем earnings данные
    const earnings = await jupiterService.getEarnings(walletAddress, positionAddresses)
    
    return NextResponse.json({
      success: true,
      data: earnings,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch earnings data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
