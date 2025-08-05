// src/app/api/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const dbUrl = process.env.DATABASE_URL ? 'SET' : 'MISSING';
    const nextAuthUrl = process.env.NEXTAUTH_URL ? 'SET' : 'MISSING';
    const nextAuthSecret = process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING';

    return NextResponse.json({
      status: 'debug-healthy',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: dbUrl,
        NEXTAUTH_URL: nextAuthUrl,
        NEXTAUTH_SECRET: nextAuthSecret,
      },
      platform: {
        vercel: !!process.env.VERCEL,
        region: process.env.VERCEL_REGION || 'unknown'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'debug-error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      status: 'debug-post-ok',
      receivedBody: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'debug-post-error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}