import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitStore, cleanupExpiredEntries } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// POST - Cleanup expired rate limit entries (called by Vercel cron)
export async function POST(request: NextRequest) {
  try {
    // Vercel cron jobs are called internally, no auth needed
    // But we can add a simple verification if desired
    const userAgent = request.headers.get('user-agent')
    const isVercelCron = userAgent?.includes('Vercel') || process.env.NODE_ENV === 'development'
    
    if (!isVercelCron) {
      console.warn('Rate limit cleanup called from non-Vercel source:', userAgent)
    }

    // Perform cleanup
    const cleanupResult = await cleanupExpiredEntries()
    
    return NextResponse.json({
      success: true,
      message: 'Rate limit cleanup completed by Vercel cron',
      cleanedEntries: cleanupResult.cleanedEntries,
      remainingEntries: cleanupResult.remainingEntries,
      timestamp: new Date().toISOString(),
      source: 'vercel-cron'
    })

  } catch (error) {
    console.error('Rate limit cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup rate limits' },
      { status: 500 }
    )
  }
}

// GET - Manual cleanup trigger (for testing/debugging)
export async function GET(request: NextRequest) {
  try {
    // Only allow in development or with proper auth
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Method not allowed in production' }, { status: 405 })
    }

    const cleanupResult = await cleanupExpiredEntries()
    
    return NextResponse.json({
      success: true,
      message: 'Manual rate limit cleanup completed',
      cleanedEntries: cleanupResult.cleanedEntries,
      remainingEntries: cleanupResult.remainingEntries,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Manual rate limit cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup rate limits' },
      { status: 500 }
    )
  }
}
