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
    const personId = searchParams.get('personId')
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let where: any = {}
    
    // Filter by person if specified
    if (personId) {
      where.personId = personId
    }
    
    // Filter by project if specified
    if (projectId) {
      where.projectId = projectId
    }

    // For non-SUPERUSER roles, filter by their access
    if (session.user?.role !== 'SUPERUSER') {
      if (session.user?.role === 'ADMIN') {
        // Admin can see work logs from their companies
        const personTenants = await prisma.personTenants.findMany({
          where: {
            personId: session.user?.id,
            status: 'ACTIVE'
          },
          select: { companyId: true }
        })
        
        const adminCompanyIds = personTenants.map(ut => ut.companyId)
        
        where.project = {
          companyId: {
            in: adminCompanyIds
          }
        }
      } else if (session.user?.role === 'SUPERVISOR') {
        // Supervisor can see work logs from workers they supervise on the same projects
        const supervisorProjects = await prisma.personProjects.findMany({
          where: {
            personId: session.user?.id,
            status: 'ACTIVE'
          },
          select: { projectId: true }
        })
        
        
        const projectIds = supervisorProjects.map(sp => sp.projectId)
        
        if (projectIds.length > 0) {
          // Get all workers assigned to the same projects
          const workerAssignments = await prisma.personProjects.findMany({
            where: {
              projectId: { in: projectIds },
              status: 'ACTIVE'
            },
            include: {
              person: {
                select: {
                  id: true,
                  role: true
                }
              }
            }
          })
          
          // Filter to only include workers (not other supervisors/admins)
          const workerIds = workerAssignments
            .filter(wa => wa.person.role === 'WORKER')
            .map(wa => wa.personId)
          
          // Include supervisor's own worklogs and their workers' worklogs
          workerIds.push(session.user?.id!)
          
          where.personId = { in: workerIds }
        } else {
          // If no projects assigned, only see own worklogs
          where.personId = session.user?.id
        }
      } else {
        // WORKER can only see their own work logs
        where.personId = session.user?.id
      }
    }

    
    const workLogs = await prisma.workLogs.findMany({
      where,
      include: {
        person: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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
      person: {
        id: log.person.id,
        name: log.person.name,
        email: log.person.email
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
  console.log('🔵 POST method called - Creating new worklog')
  
  // Ensure this is actually a POST request
  if (request.method !== 'POST') {
    console.log('🔵 POST method called but request.method is:', request.method)
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('🔵 POST request body:', body)
    let { projectId, description } = body
    
    const prisma = await getPrisma()

    // For workers, check if they have an active worklog and validate project matches
    if (session.user?.role === 'WORKER') {
      const activeWorkLog = await prisma.workLogs.findFirst({
        where: {
          personId: session.user?.id,
          clockOut: null // Active worklog (not clocked out)
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      if (activeWorkLog) {
        // Worker is already clocked in, they cannot create another worklog
        return NextResponse.json({ 
          error: `Ya estás trabajando en ${activeWorkLog.project?.name}. Debes hacer clock out antes de crear un nuevo registro.` 
        }, { status: 400 })
      }
    }

    // Validate project exists and person has access
    let project = null;
    if (projectId) {
      project = await prisma.projects.findUnique({
        where: { id: projectId },
        include: { company: true }
      })
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      // Check if person has access to this project
      if (session.user?.role === 'ADMIN') {
        const personTenant = await prisma.personTenants.findFirst({
          where: {
            personId: session.user?.id,
            companyId: project.company.id,
            status: 'ACTIVE'
          }
        })
        
        if (!personTenant) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      } else if (session.user?.role !== 'SUPERUSER') {
        // Check if person is assigned to this project
        const personProject = await prisma.personProjects.findFirst({
          where: {
            personId: session.user?.id,
            projectId: projectId,
            status: 'ACTIVE'
          }
        })
        
        if (!personProject) {
          return NextResponse.json({ 
            error: `No tienes acceso al proyecto. Contacta a tu supervisor para ser asignado.` 
          }, { status: 400 })
        }
      }
    }

    // Create work log
    const workLog = await prisma.workLogs.create({
      data: {
        personId: session.user?.id!,
        projectId: projectId || null,
        clockIn: new Date(),
        tasksCompleted: [],
        materialsUsed: [],
        photos: [],
        notes: description || '',
        notesEs: description || '',
        companyId: project?.company?.id || null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        person: {
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

    // Create audit log for worklog creation
    await prisma.auditLogs.create({
      data: {
        personId: session.user?.id!,
        action: 'WORKLOG_CREATE',
        entityType: 'WORKLOG',
        entityId: workLog.id,
        newValues: {
          projectId: projectId || null,
          clockIn: workLog.clockIn.toISOString(),
          description: description || ''
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
        person: workLog.person,
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
  console.log('🔴 PUT method called - Updating worklog')
  console.log('🔴 Actual request method:', request.method)
  
  // Ensure this is actually a PUT request
  if (request.method !== 'PUT') {
    console.log('🔴 PUT method called but request.method is:', request.method)
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('🔴 PUT request body:', body)
    const { id, endTime, description } = body
    
    const prisma = await getPrisma()

    // Find the work log
    const workLog = await prisma.workLogs.findUnique({
      where: { id },
      include: {
        person: true,
        project: {
          include: { company: true }
        }
      }
    })

    if (!workLog) {
      return NextResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    // Check if person can modify this work log
    if (session.user?.role !== 'SUPERUSER' && workLog.personId !== session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update work log
    const updatedWorkLog = await prisma.workLogs.update({
      where: { id },
      data: {
        clockOut: endTime ? new Date(endTime) : null,
        notes: description || workLog.notes,
        notesEs: description || workLog.notesEs,
        updatedAt: new Date()
      },
      include: {
        person: {
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

    // Create audit log for worklog update
    await prisma.auditLogs.create({
      data: {
        personId: session.user?.id!,
        action: 'WORKLOG_UPDATE',
        entityType: 'WORKLOG',
        entityId: workLog.id,
        oldValues: {
          clockOut: workLog.clockOut?.toISOString() || null,
          notes: workLog.notes
        },
        newValues: {
          clockOut: updatedWorkLog.clockOut?.toISOString() || null,
          notes: description || workLog.notes
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
        person: updatedWorkLog.person,
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

