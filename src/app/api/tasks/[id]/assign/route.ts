import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for task assignment
const assignmentSchema = z.object({
  personIds: z.array(z.string()).min(1, 'At least one user must be assigned'),
})

// POST - Assign task to users
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = assignmentSchema.parse(body)
    const taskId = params.id
    
    const prisma = await getPrisma()
    
    // Get person's company context
    let companyId = session.user?.companyId
    
    if (!companyId) {
      const personTenant = await prisma.personTenants.findFirst({
        where: {
          personId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      })
      companyId = personTenant?.companyId
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    // First, check if the task exists
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId
      },
      include: {
        projectAssignments: {
          include: {
            project: true
          }
        },
        workerAssignments: {
          include: {
            project: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if task belongs to the person's company
    const hasProjectAssignment = task.projectAssignments.some(pa => pa.project.companyId === companyId)
    const hasWorkerAssignment = task.workerAssignments.some(wa => wa.project.companyId === companyId)
    
    if (!hasProjectAssignment && !hasWorkerAssignment) {
      return NextResponse.json({ error: 'Task not found in your company' }, { status: 404 })
    }

    // Verify all people belong to the same company and are WORKERs
    const people = await prisma.people.findMany({
      where: {
        id: { in: validatedData.personIds },
        personTenants: {
          some: {
            companyId: companyId,
            status: 'ACTIVE'
          }
        },
        role: 'WORKER'
      }
    })

    if (people.length !== validatedData.personIds.length) {
      return NextResponse.json({ 
        error: 'Some people not found or not authorized for this company' 
      }, { status: 400 })
    }

    // Assign task to users in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Remove existing assignments for this task
      await tx.personTasks.deleteMany({
        where: { taskId: taskId }
      })

      // Create new assignments
      const assignments = await tx.personTasks.createMany({
        data: validatedData.personIds.map(personId => ({
          personId: personId,
          taskId: taskId,
          assignedBy: session.user?.id || '',
        }))
      })

      // Update task status to IN_PROGRESS if it was NOT_STARTED
      if (task.status === 'NOT_STARTED') {
        await tx.tasks.update({
          where: { id: taskId },
          data: { status: 'IN_PROGRESS' }
        })
      }

      return assignments
    })

    return NextResponse.json({
      success: true,
      message: 'Task assigned successfully',
      assignments: result
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

// DELETE - Unassign task from users
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const taskId = params.id
    
    const prisma = await getPrisma()
    
    // Get person's company context
    let companyId = session.user?.companyId
    
    if (!companyId) {
      const personTenant = await prisma.personTenants.findFirst({
        where: {
          personId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      })
      companyId = personTenant?.companyId
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    // First, check if the task exists
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId
      },
      include: {
        projectAssignments: {
          include: {
            project: true
          }
        },
        workerAssignments: {
          include: {
            project: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if task belongs to the person's company
    const hasProjectAssignment = task.projectAssignments.some(pa => pa.project.companyId === companyId)
    const hasWorkerAssignment = task.workerAssignments.some(wa => wa.project.companyId === companyId)
    
    if (!hasProjectAssignment && !hasWorkerAssignment) {
      return NextResponse.json({ error: 'Task not found in your company' }, { status: 404 })
    }

    // Build where clause for deletion
    const whereClause: any = { taskId: taskId }
    
    if (userId) {
      whereClause.userId = userId
    }

    // Remove assignments
    const result = await prisma.personTasks.deleteMany({
      where: whereClause
    })

    // Check if task has any remaining assignments
    const remainingAssignments = await prisma.personTasks.count({
      where: { taskId: taskId }
    })

    // If no assignments remain, set task status back to NOT_STARTED
    if (remainingAssignments === 0) {
      await prisma.tasks.update({
        where: { id: taskId },
        data: { status: 'NOT_STARTED' }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Task unassigned successfully',
      deletedCount: result.count
    })

  } catch (error) {
    console.error('Error unassigning task:', error)
    return NextResponse.json(
      { error: 'Failed to unassign task' },
      { status: 500 }
    )
  }
}
