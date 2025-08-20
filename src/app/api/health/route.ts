// src/app/api/health/route.ts
// Health check route for monitoring system health status

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test database connection
    const prisma = await getPrisma();
    
    // Simple query to test database connectivity
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp FROM companies LIMIT 1`;    
    await prisma.$disconnect();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        status: 'connected',
        test: result
      },
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      environment: process.env.NODE_ENV || 'development'
    }, { status: 503 });
  }
}
