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
      message: 'Database test skipped during build' 
    });
  }
  try {
    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Database connection test result:', result)
    
    return NextResponse.json({
      message: 'Database connection successful',
      result
    })
  } catch (error) {
    console.error('Database connection test error:', error)
    return NextResponse.json({
      message: 'Database connection failed',
      error: (error as any)?.message
    }, { status: 500 })
  }
} 


