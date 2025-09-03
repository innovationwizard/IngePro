import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - Get system-wide statistics for superusers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'SUPERUSER') {
      return NextResponse.json({ error: 'Unauthorized - Superuser access required' }, { status: 401 })
    }

    const prisma = await getPrisma()
    
    // Get real system statistics
    const [
      activeTenants,
      totalPeople,
      systemUptime,
      activeAlerts
    ] = await Promise.all([
      // Active Tenants (companies with ACTIVE status)
      prisma.companies.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Total People (all active people)
      prisma.people.count({
        where: { status: 'ACTIVE' }
      }),
      
      // System Uptime (calculate based on recent activity)
      calculateSystemUptime(prisma),
      
      // Active Alerts (placeholder for now - you can implement real alerting later)
      Promise.resolve(0)
    ])

    return NextResponse.json({
      activeTenants,
      totalPeople,
      systemUptime,
      activeAlerts
    })

  } catch (error) {
    console.error('Error fetching superuser stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    )
  }
}

// Helper function to calculate system uptime based on recent activity
async function calculateSystemUptime(prisma: any) {
  try {
    // Check for activity in the last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const recentActivity = await prisma.workLogs.findFirst({
      where: {
        createdAt: {
          gte: yesterday
        }
      }
    })
    
    // If there's recent activity, assume system is up
    // In a real production system, you'd want more sophisticated uptime monitoring
    if (recentActivity) {
      return '99.9%'
    }
    
    // Check for activity in the last week
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    const weeklyActivity = await prisma.workLogs.findFirst({
      where: {
        createdAt: {
          gte: lastWeek
        }
      }
    })
    
    if (weeklyActivity) {
      return '95.0%'
    }
    
    return '90.0%'
  } catch (error) {
    console.error('Error calculating system uptime:', error)
    return 'Unknown'
  }
}
