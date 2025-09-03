import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    
    // Get current user info
    const currentUser = await prisma.people.findUnique({
      where: { id: session.user?.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    // Get all worklogs
    const allWorkLogs = await prisma.workLogs.findMany({
      include: {
        person: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })
    
    // Get all project assignments
    const allProjectAssignments = await prisma.personProjects.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    // Get supervisor's project assignments (if supervisor)
    let supervisorProjects = []
    if (session.user?.role === 'SUPERVISOR') {
      supervisorProjects = await prisma.personProjects.findMany({
        where: {
          personId: session.user?.id,
          status: 'ACTIVE'
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
    }
    
    // Get workers assigned to supervisor's projects
    let supervisedWorkers = []
    if (session.user?.role === 'SUPERVISOR' && supervisorProjects.length > 0) {
      const projectIds = supervisorProjects.map(sp => sp.projectId)
      supervisedWorkers = await prisma.personProjects.findMany({
        where: {
          projectId: { in: projectIds },
          status: 'ACTIVE'
        },
        include: {
          person: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    }
    
    return NextResponse.json({
      currentUser,
      totalWorkLogs: allWorkLogs.length,
      recentWorkLogs: allWorkLogs,
      totalProjectAssignments: allProjectAssignments.length,
      allProjectAssignments,
      supervisorProjects,
      supervisedWorkers: supervisedWorkers.filter(sw => sw.person.role === 'WORKER'),
      debug: {
        userRole: session.user?.role,
        supervisorProjectCount: supervisorProjects.length,
        supervisedWorkerCount: supervisedWorkers.filter(sw => sw.person.role === 'WORKER').length
      }
    })

  } catch (error) {
    console.error('Error in worklog debug endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch worklog debug data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
