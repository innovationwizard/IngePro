import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for task assignment
const taskAssignmentSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  workerIds: z.array(z.string()).optional(), // Optional worker assignments
})

// POST - Assign task to project and optionally to workers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = taskAssignmentSchema.parse(body)
    
    const prisma = await getPrisma()
    
    // Get user's company context
    let companyId = session.user?.companyId
    
    if (!companyId) {
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      })
      companyId = userTenant?.companyId
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        companyId: companyId
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify task exists
    const task = await prisma.task.findFirst({
      where: {
        id: validatedData.taskId
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Create assignments in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Assign task to project
      const projectAssignment = await tx.taskProjectAssignment.create({
        data: {
          taskId: validatedData.taskId,
          projectId: validatedData.projectId,
          assignedBy: session.user?.id || '',
        }
      })

      // Assign task to workers if provided
      let workerAssignments = []
      if (validatedData.workerIds && validatedData.workerIds.length > 0) {
        // Verify all workers belong to the company
        const workers = await tx.user.findMany({
          where: {
            id: { in: validatedData.workerIds },
            userTenants: {
              some: {
                companyId: companyId,
                status: 'ACTIVE'
              }
            }
          }
        })

        if (workers.length !== validatedData.workerIds.length) {
          throw new Error('Some workers not found or not in company')
        }

        // Create worker assignments
        workerAssignments = await Promise.all(
          validatedData.workerIds.map(workerId =>
            tx.taskWorkerAssignment.create({
              data: {
                taskId: validatedData.taskId,
                projectId: validatedData.projectId,
                workerId: workerId,
                assignedBy: session.user?.id || '',
              }
            })
          )
        )
      }

      return {
        projectAssignment,
        workerAssignments
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Task assigned successfully',
      result
    })

  } catch (error) {
    console.error('Error assigning task:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    )
  }
}
