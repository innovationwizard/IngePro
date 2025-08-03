import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
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

export async function POST() {
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

# Added VERCEL LARGEST IP RANGE FOR CONNECTIVITY TEST TO DB