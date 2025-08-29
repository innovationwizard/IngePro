import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    
    // Get supervisor's project assignments
    const supervisorProjects = await prisma.personProjects.findMany({
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
    
    // Get all people in the system
    const allPeople = await prisma.people.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
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
      take: 10
    })
    
    return NextResponse.json({
      currentUser: {
        id: session.user?.id,
        name: session.user?.name,
        role: session.user?.role
      },
      supervisorProjects,
      allPeople,
      allProjectAssignments,
      recentWorkLogs: allWorkLogs
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    )
  }
}
