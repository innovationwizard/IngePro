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

    // At this point, companyId is guaranteed to be defined
    const finalCompanyId = companyId

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
    const hasProjectAssignment = task.projectAssignments.some(pa => pa.project.companyId === finalCompanyId)
    const hasWorkerAssignment = task.workerAssignments.some(wa => wa.project.companyId === finalCompanyId)
    
    if (!hasProjectAssignment && !hasWorkerAssignment) {
      return NextResponse.json({ error: 'Task not found in your company' }, { status: 404 })
    }

    // Verify all people belong to the same company and are WORKERs
    const people = await prisma.people.findMany({
      where: {
        id: { in: validatedData.personIds },
        personTenants: {
          some: {
            companyId: finalCompanyId,
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
      // Create new worker assignments first
      const assignments = await Promise.all(
        validatedData.personIds.map(async (personId) => {
          // Get the first project assignment for this task to use as projectId
          const projectAssignment = task.projectAssignments[0]
          if (!projectAssignment) {
            throw new Error('Task must be assigned to a project before assigning to workers')
          }

          return tx.taskWorkerAssignments.create({
            data: {
              taskId: taskId,
              projectId: projectAssignment.projectId,
              workerId: personId,
              assignedBy: session.user?.id || '',
            }
          })
        })
      )

      // Now safely delete old assignments (new ones are already created)
      await tx.taskWorkerAssignments.deleteMany({
        where: { 
          taskId: taskId,
          id: { notIn: assignments.map(a => a.id) }
        }
      })

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
        { error: 'Validation failed', details: error.issues },
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
      whereClause.workerId = userId
    }

    // Remove worker assignments
    const result = await prisma.taskWorkerAssignments.deleteMany({
      where: whereClause
    })

    // Check if task has any remaining worker assignments
    const remainingAssignments = await prisma.taskWorkerAssignments.count({
      where: { taskId: taskId }
    })

    // Note: Tasks are universal and don't have status, so no need to update status
    // The task remains available for future assignments

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
