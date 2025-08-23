import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const prisma = await getPrisma()
    
    // Get all projects with people counts
    const projects = await prisma.projects.findMany({
      select: {
        id: true,
        name: true,
        companyId: true,
        status: true,
        _count: {
          select: {
            workLogs: true
          }
        }
      }
    })
    
    // For each project, count active people (this is a workaround until Prisma client is fixed)
    const projectStats = await Promise.all(
      projects.map(async (project) => {
        // Count people assigned to this project via PersonProjects
        const peopleCount = await prisma.personProjects.count({
          where: {
            projectId: project.id,
            status: 'ACTIVE'
          }
        })
        
        return {
          id: project.id,
          peopleCount,
          workLogCount: project._count.workLogs
        }
      })
    )
    
    return NextResponse.json({ projectStats })

  } catch (error) {
    console.error('Error fetching project stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project stats' },
      { status: 500 }
    )
  }
}
