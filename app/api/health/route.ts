import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'

export async function GET() {
  try {
    // Test database connection
    await connectDB()

    return NextResponse.json({
      success: true,
      message: 'OniCommerce API is healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        server: 'running',
      },
      version: '1.0.0',
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'API health check failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}