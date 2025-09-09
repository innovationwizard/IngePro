import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workerId = params.id
    const prisma = await getPrisma()
    
    // Get worker info
    const worker = await prisma.people.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      }
    })

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    }

    // Get project assignments
    const projectAssignments = await prisma.personProjects.findMany({
      where: {
        personId: workerId,
        status: 'ACTIVE'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Get worklogs
    const worklogs = await prisma.workLogs.findMany({
      where: {
        personId: workerId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get available projects in worker's company
    const availableProjects = await prisma.projects.findMany({
      where: {
        status: 'ACTIVE',
        companyId: worker.companyId
      },
      select: {
        id: true,
        name: true,
        company: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      worker,
      projectAssignments: {
        count: projectAssignments.length,
        assignments: projectAssignments
      },
      worklogs: {
        count: worklogs.length,
        logs: worklogs
      },
      availableProjects: {
        count: availableProjects.length,
        projects: availableProjects
      },
    })

  } catch (error) {
    console.error('Error in worker status debug endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch worker status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
