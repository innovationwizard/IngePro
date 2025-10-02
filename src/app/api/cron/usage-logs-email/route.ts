import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { sendUsageLogsEmail, UsageLogEntry } from '@/lib/emailService'

export const runtime = 'nodejs'

// POST - Send hourly usage logs email (called by cron job)
export async function POST(request: NextRequest) {
  try {
    // Detect the source of the request
    const userAgent = request.headers.get('user-agent')
    const isGitHubActions = userAgent?.includes('gh-hourly-cron')
    const isVercelCron = userAgent?.includes('Vercel') || process.env.NODE_ENV === 'development'
    
    let source = 'unknown'
    let message = 'Usage logs email sent'
    
    if (isGitHubActions) {
      source = 'github-actions-cron'
      message = 'Usage logs email sent by GitHub Actions cron'
    } else if (isVercelCron) {
      source = 'vercel-cron'
      message = 'Usage logs email sent by Vercel cron'
    } else {
      console.warn('Usage logs email called from unknown source:', userAgent)
      source = 'manual'
      message = 'Usage logs email sent manually'
    }

    const prisma = await getPrisma()
    
    // Get audit logs from the last 99 days (as requested)
    const ninetyNineDaysAgo = new Date()
    ninetyNineDaysAgo.setDate(ninetyNineDaysAgo.getDate() - 99)
    
    const auditLogs = await prisma.auditLogs.findMany({
      where: {
        createdAt: {
          gte: ninetyNineDaysAgo
        }
      },
      include: {
        person: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert audit logs to usage log entries
    const usageLogs: UsageLogEntry[] = auditLogs.map(log => {
      // Convert to Guatemala time (UTC-6)
      const guatemalaTime = new Date(log.createdAt.getTime() - (6 * 60 * 60 * 1000))
      const timestamp = guatemalaTime.toISOString().replace('T', ' ').substring(0, 19)
      
      // Map action to short name
      const actionMap: { [key: string]: string } = {
        'LOGIN': 'log in',
        'LOGOUT': 'log out',
        'CREATE': 'created',
        'UPDATE': 'updated',
        'DELETE': 'deleted',
        'ASSIGN': 'assigned',
        'UNASSIGN': 'unassigned',
        'LOCATION_UPDATE': 'location update',
        'PASSWORD_SET': 'set password',
        'PASSWORD_RESET': 'reset password',
        'WORKLOG_CREATE': 'submitted worklog entry',
        'WORKLOG_UPDATE': 'updated worklog entry',
        'TASK_PROGRESS': 'updated task progress',
        'PROJECT_CREATE': 'added new project',
        'TASK_CREATE': 'added new task',
        'MATERIAL_CREATE': 'added new material',
        'MATERIAL_UPDATE': 'updated material',
        'INVENTORY_MOVEMENT': 'inventory movement',
        'REORDER_REQUEST': 'reorder request'
      }
      
      const action = actionMap[log.action] || log.action.toLowerCase()
      const entityInfo = log.entityType ? ` ${log.entityType.toLowerCase()}` : ''
      
      return {
        timestamp,
        user: log.person.name || log.person.email,
        action: `${action}${entityInfo}`
      }
    })

    // Send email
    const emailSent = await sendUsageLogsEmail(usageLogs)
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send usage logs email' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message,
      logsProcessed: usageLogs.length,
      timeRange: {
        from: ninetyNineDaysAgo.toISOString(),
        to: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      source
    })

  } catch (error) {
    console.error('Usage logs email error:', error)
    return NextResponse.json(
      { error: 'Failed to send usage logs email' },
      { status: 500 }
    )
  }
}

// GET - Manual trigger for usage logs email (accessible in production)
export async function GET(request: NextRequest) {
  try {
    // Allow manual access in production for external bot usage

    const prisma = await getPrisma()
    
    // Get recent audit logs (last 24 hours for testing)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    const auditLogs = await prisma.auditLogs.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      },
      include: {
        person: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert audit logs to usage log entries
    const usageLogs: UsageLogEntry[] = auditLogs.map(log => {
      const guatemalaTime = new Date(log.createdAt.getTime() - (6 * 60 * 60 * 1000))
      const timestamp = guatemalaTime.toISOString().replace('T', ' ').substring(0, 19)
      
      const actionMap: { [key: string]: string } = {
        'LOGIN': 'log in',
        'LOGOUT': 'log out',
        'CREATE': 'created',
        'UPDATE': 'updated',
        'DELETE': 'deleted',
        'ASSIGN': 'assigned',
        'UNASSIGN': 'unassigned',
        'LOCATION_UPDATE': 'location update',
        'PASSWORD_SET': 'set password',
        'PASSWORD_RESET': 'reset password',
        'WORKLOG_CREATE': 'submitted worklog entry',
        'WORKLOG_UPDATE': 'updated worklog entry',
        'TASK_PROGRESS': 'updated task progress',
        'PROJECT_CREATE': 'added new project',
        'TASK_CREATE': 'added new task',
        'MATERIAL_CREATE': 'added new material',
        'MATERIAL_UPDATE': 'updated material',
        'INVENTORY_MOVEMENT': 'inventory movement',
        'REORDER_REQUEST': 'reorder request'
      }
      
      const action = actionMap[log.action] || log.action.toLowerCase()
      const entityInfo = log.entityType ? ` ${log.entityType.toLowerCase()}` : ''
      
      return {
        timestamp,
        user: log.person.name || log.person.email,
        action: `${action}${entityInfo}`
      }
    })

    // Send email
    const emailSent = await sendUsageLogsEmail(usageLogs)
    
    return NextResponse.json({
      success: true,
      message: 'Manual usage logs email sent',
      logsProcessed: usageLogs.length,
      emailSent,
      timeRange: {
        from: oneDayAgo.toISOString(),
        to: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Manual usage logs email error:', error)
    return NextResponse.json(
      { error: 'Failed to send usage logs email' },
      { status: 500 }
    )
  }
}
