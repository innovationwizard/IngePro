import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Get work logs with proper user and project relationships
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let where: any = {}
    
    // Filter by user if specified
    if (userId) {
      where.userId = userId
    }
    
    // Filter by project if specified
    if (projectId) {
      where.projectId = projectId
    }

    // For non-SUPERUSER roles, filter by their access
    if (session.user?.role !== 'SUPERUSER') {
      if (session.user?.role === 'ADMIN') {
        // Admin can see work logs from their companies
        const userTenants = await prisma.userTenant.findMany({
          where: {
            userId: session.user?.id,
            status: 'ACTIVE'
          },
          select: { companyId: true }
        })
        
        const adminCompanyIds = userTenants.map(ut => ut.companyId)
        
        where.project = {
          companyId: {
            in: adminCompanyIds
          }
        }
      } else {
        // WORKER/SUPERVISOR can only see their own work logs
        where.userId = session.user?.id
      }
    }

    const workLogs = await prisma.workLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Transform the data to match frontend expectations
    const transformedWorkLogs = workLogs.map(log => ({
      id: log.id,
      startTime: log.clockIn.toISOString(),
      endTime: log.clockOut ? log.clockOut.toISOString() : null,
      duration: log.clockOut ? 
        Math.round((log.clockOut.getTime() - log.clockIn.getTime()) / (1000 * 60)) : null, // Duration in minutes
      description: log.notes || log.notesEs || '',
      status: log.clockOut ? 'COMPLETED' : 'ACTIVE',
      createdAt: log.createdAt.toISOString(),
      user: {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email
      },
      project: log.project ? {
        id: log.project.id,
        name: log.project.name,
        company: log.project.company
      } : undefined
    }))

    return NextResponse.json({
      workLogs: transformedWorkLogs,
      count: transformedWorkLogs.length
    })

  } catch (error) {
    console.error('Error fetching work logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work logs' },
      { status: 500 }
    )
  }
}

// POST - Create a new work log (simplified for time tracking)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, description } = body
    
    const prisma = await getPrisma()

    // Validate project exists and user has access
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { company: true }
      })
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      // Check if user has access to this project
      if (session.user?.role === 'ADMIN') {
        const userTenant = await prisma.userTenant.findFirst({
          where: {
            userId: session.user?.id,
            companyId: project.company.id,
            status: 'ACTIVE'
          }
        })
        
        if (!userTenant) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      } else if (session.user?.role !== 'SUPERUSER') {
        // Check if user is assigned to this project
        const userProject = await prisma.userProject.findFirst({
          where: {
            userId: session.user?.id,
            projectId: projectId,
            status: 'ACTIVE'
          }
        })
        
        if (!userProject) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
    }

    // Create work log
    const workLog = await prisma.workLog.create({
      data: {
        userId: session.user?.id!,
        projectId: projectId || null,
        clockIn: new Date(),
        notes: description || '',
        notesEs: description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Work log created successfully',
      workLog: {
        id: workLog.id,
        startTime: workLog.clockIn.toISOString(),
        endTime: null,
        duration: null,
        description: workLog.notes || '',
        status: 'ACTIVE',
        createdAt: workLog.createdAt.toISOString(),
        user: workLog.user,
        project: workLog.project
      }
    })

  } catch (error) {
    console.error('Error creating work log:', error)
    return NextResponse.json(
      { error: 'Failed to create work log' },
      { status: 500 }
    )
  }
}

// PUT - Update work log (end time tracking)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, endTime, description } = body
    
    const prisma = await getPrisma()

    // Find the work log
    const workLog = await prisma.workLog.findUnique({
      where: { id },
      include: {
        user: true,
        project: {
          include: { company: true }
        }
      }
    })

    if (!workLog) {
      return NextResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    // Check if user can modify this work log
    if (session.user?.role !== 'SUPERUSER' && workLog.userId !== session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update work log
    const updatedWorkLog = await prisma.workLog.update({
      where: { id },
      data: {
        clockOut: endTime ? new Date(endTime) : null,
        notes: description || workLog.notes,
        notesEs: description || workLog.notesEs,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    const duration = updatedWorkLog.clockOut ? 
      Math.round((updatedWorkLog.clockOut.getTime() - updatedWorkLog.clockIn.getTime()) / (1000 * 60)) : null

    return NextResponse.json({
      success: true,
      message: 'Work log updated successfully',
      workLog: {
        id: updatedWorkLog.id,
        startTime: updatedWorkLog.clockIn.toISOString(),
        endTime: updatedWorkLog.clockOut ? updatedWorkLog.clockOut.toISOString() : null,
        duration,
        description: updatedWorkLog.notes || '',
        status: updatedWorkLog.clockOut ? 'COMPLETED' : 'ACTIVE',
        createdAt: updatedWorkLog.createdAt.toISOString(),
        user: updatedWorkLog.user,
        project: updatedWorkLog.project
      }
    })

  } catch (error) {
    console.error('Error updating work log:', error)
    return NextResponse.json(
      { error: 'Failed to update work log' },
      { status: 500 }
    )
  }
}