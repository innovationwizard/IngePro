import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - prevents build-time database connections
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Skip database connection during build
  if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
    return NextResponse.json({ 
      status: 'build-time-skip',
      message: 'Environment check skipped during build' 
    });
  }
  const hasDatabaseUrl = !!process.env.DATABASE_URL
  const databaseUrlLength = process.env.DATABASE_URL?.length || 0
  const databaseUrlStart = process.env.DATABASE_URL?.substring(0, 50) || 'not set'
  
  return NextResponse.json({
    hasDatabaseUrl,
    databaseUrlLength,
    databaseUrlStart,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
} 