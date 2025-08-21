import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for task assignment
const assignmentSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user must be assigned'),
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

    // Verify the task belongs to the user's company
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          companyId: companyId
        }
      },
      include: {
        project: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify all users belong to the same company and are WORKERs
    const users = await prisma.user.findMany({
      where: {
        id: { in: validatedData.userIds },
        userTenants: {
          some: {
            companyId: companyId,
            status: 'ACTIVE'
          }
        },
        role: 'WORKER'
      }
    })

    if (users.length !== validatedData.userIds.length) {
      return NextResponse.json({ 
        error: 'Some users not found or not authorized for this company' 
      }, { status: 400 })
    }

    // Assign task to users in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Remove existing assignments for this task
      await tx.userTask.deleteMany({
        where: { taskId: taskId }
      })

      // Create new assignments
      const assignments = await tx.userTask.createMany({
        data: validatedData.userIds.map(userId => ({
          userId: userId,
          taskId: taskId,
          assignedBy: session.user?.id || '',
        }))
      })

      // Update task status to IN_PROGRESS if it was NOT_STARTED
      if (task.status === 'NOT_STARTED') {
        await tx.task.update({
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

    // Verify the task belongs to the user's company
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          companyId: companyId
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Build where clause for deletion
    const whereClause: any = { taskId: taskId }
    
    if (userId) {
      whereClause.userId = userId
    }

    // Remove assignments
    const result = await prisma.userTask.deleteMany({
      where: whereClause
    })

    // Check if task has any remaining assignments
    const remainingAssignments = await prisma.userTask.count({
      where: { taskId: taskId }
    })

    // If no assignments remain, set task status back to NOT_STARTED
    if (remainingAssignments === 0) {
      await prisma.task.update({
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
