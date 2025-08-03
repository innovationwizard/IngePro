import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test the connection string
    const connectionString = process.env.DATABASE_URL
    const hasConnectionString = !!connectionString
    const connectionStringLength = connectionString?.length || 0
    
    // Test Prisma connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    return NextResponse.json({
      success: true,
      connectionString: {
        exists: hasConnectionString,
        length: connectionStringLength,
        start: connectionString?.substring(0, 50) || 'not set'
      },
      prismaTest: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        name: (error as any)?.name,
        message: (error as any)?.message,
        code: (error as any)?.code
      },
      connectionString: {
        exists: !!process.env.DATABASE_URL,
        length: process.env.DATABASE_URL?.length || 0,
        start: process.env.DATABASE_URL?.substring(0, 50) || 'not set'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 