// src/app/api/debug-connection/route.ts
// Simplified debug endpoint for Vercel Edge Runtime

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Use Node.js runtime instead of Edge

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing connection from Vercel environment...');
    
    // Test 1: Check environment variables
    const dbUrl = process.env.DATABASE_URL;
    const directDbUrl = process.env.DIRECT_DATABASE_URL;
    
    if (!dbUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
    }
    
    // Test 2: Parse the URL
    const url = new URL(dbUrl.replace('postgresql://', 'http://'));
    
    // Test 3: Try to create a simple Prisma connection
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl
        }
      }
    });
    
    // Test 4: Simple query test
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful from Vercel',
      hostname: url.hostname,
      port: url.port || '5432',
      result: result,
      region: process.env.VERCEL_REGION || 'unknown',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    
    return NextResponse.json({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: error instanceof Error ? (error as any).code : undefined,
      hostname: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL.replace('postgresql://', 'http://')).hostname : 'unknown',
      region: process.env.VERCEL_REGION || 'unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}