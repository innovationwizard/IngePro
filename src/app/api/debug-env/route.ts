import { NextResponse } from 'next/server'

export async function GET() {
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