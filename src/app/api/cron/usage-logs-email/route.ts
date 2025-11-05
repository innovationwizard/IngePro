import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { sendUsageLogsEmail, UsageLogEntry } from '@/lib/emailService'

export const runtime = 'nodejs'

// POST - Send usage logs email (called manually or by external app)
export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent')
    const source = 'manual'
    const message = 'Usage Logs Email sent'

    const prisma = await getPrisma()
    
    // Get audit logs from the last 8 hours
    const eightHoursAgo = new Date()
    eightHoursAgo.setHours(eightHoursAgo.getHours() - 8)
    
    const auditLogs = await prisma.auditLogs.findMany({
      where: {
        createdAt: {
          gte: eightHoursAgo
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
        from: eightHoursAgo.toISOString(),
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
    const prisma = await getPrisma()
    
    // Get audit logs from the last 8 hours (same as POST method)
    const eightHoursAgo = new Date()
    eightHoursAgo.setHours(eightHoursAgo.getHours() - 8)
    
    const auditLogs = await prisma.auditLogs.findMany({
      where: {
        createdAt: {
          gte: eightHoursAgo
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
      message: 'Usage logs email sent',
      logsProcessed: usageLogs.length,
      emailSent,
      timeRange: {
        from: eightHoursAgo.toISOString(),
        to: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      source: 'manual'
    })

  } catch (error) {
    console.error('Manual usage logs email error:', error)
    return NextResponse.json(
      { error: 'Failed to send usage logs email' },
      { status: 500 }
    )
  }
}
