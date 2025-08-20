import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const prisma = await getPrisma()
    
    // Get all projects with user counts
    const projects = await prisma.project.findMany({
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
    
    // For each project, count active users (this is a workaround until Prisma client is fixed)
    const projectStats = await Promise.all(
      projects.map(async (project) => {
        // Count users assigned to this project via UserProject
        const userCount = await prisma.userProject.count({
          where: {
            projectId: project.id,
            status: 'ACTIVE'
          }
        })
        
        return {
          id: project.id,
          userCount,
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
