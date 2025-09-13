import { NextRequest, NextResponse } from 'next/server'
import { protocolRegistry } from '@/services/protocol-registry'
import { initializeProtocols } from '@/services/protocols'

// Инициализируем протоколы при первом импорте
let protocolsInitialized = false
if (!protocolsInitialized) {
  initializeProtocols()
  protocolsInitialized = true
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('address')

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

    // Получаем позиции пользователя из всех протоколов
    const positions = await protocolRegistry.getUserPositions(walletAddress)
    
    return NextResponse.json({
      success: true,
      data: positions,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user positions',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
