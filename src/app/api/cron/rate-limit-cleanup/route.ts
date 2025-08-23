import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitStore, cleanupExpiredEntries } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// POST - Cleanup expired rate limit entries (called by GitHub Actions cron)
export async function POST(request: NextRequest) {
  try {
    // Detect the source of the request
    const userAgent = request.headers.get('user-agent')
    const isGitHubActions = userAgent?.includes('gh-five-minute-cron')
    const isVercelCron = userAgent?.includes('Vercel') || process.env.NODE_ENV === 'development'
    
    let source = 'unknown'
    let message = 'Rate limit cleanup completed'
    
    if (isGitHubActions) {
      source = 'github-actions-cron'
      message = 'Rate limit cleanup completed by GitHub Actions cron'
    } else if (isVercelCron) {
      source = 'vercel-cron'
      message = 'Rate limit cleanup completed by Vercel cron'
    } else {
      console.warn('Rate limit cleanup called from unknown source:', userAgent)
      source = 'manual'
      message = 'Rate limit cleanup completed manually'
    }

    // Perform cleanup
    const cleanupResult = await cleanupExpiredEntries()
    
    return NextResponse.json({
      success: true,
      message,
      cleanedEntries: cleanupResult.cleanedEntries,
      remainingEntries: cleanupResult.remainingEntries,
      timestamp: new Date().toISOString(),
      source
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
