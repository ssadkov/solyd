import { NextResponse } from 'next/server'
import { jupiterService } from '@/services/jupiter.service'
import { AggregatorData } from '@/types/aggregator'

export async function GET() {
  try {
    const data: AggregatorData[] = await jupiterService.getAggregatorData()
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch aggregator data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
