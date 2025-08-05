import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - prevents build-time database connections
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Skip database connection during build
  if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
    return NextResponse.json({ 
      status: 'build-time-skip',
      message: 'Database connection skipped during build' 
    });
  }

  try {
    const connectionString = process.env.DATABASE_URL
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`

    return NextResponse.json({
      success: true,
      connectionString: {
        exists: !!process.env.DATABASE_URL,
        length: process.env.DATABASE_URL?.length || 0,
        start: process.env.DATABASE_URL?.substring(0, 50) || 'not set'
      },
      prismaTest: testQuery,
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
    })
  }
} 