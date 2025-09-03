import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Unassign projects from a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized - Admin or Supervisor access required' }, { status: 401 })
    }

    const taskId = params.id
    const body = await request.json()
    const { projectIds } = body

    if (!Array.isArray(projectIds)) {
      return NextResponse.json({ error: 'projectIds must be an array' }, { status: 400 })
    }

    const prisma = await getPrisma()

    console.log('🗑️ Unassign projects - Task ID:', taskId)
    console.log('🗑️ Unassign projects - Project IDs to keep:', projectIds)

    // Check if task exists
    const existingTask = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        projectAssignments: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    console.log('🗑️ Unassign projects - Current project assignments:', existingTask.projectAssignments?.length || 0)

    // Remove all project assignments for this task
    const deleteResult = await prisma.taskProjectAssignments.deleteMany({
      where: {
        taskId: taskId
      }
    })

    console.log('🗑️ Unassign projects - Deleted assignments:', deleteResult.count)

    // If new projectIds are provided, create new assignments
    if (projectIds.length > 0) {
      const newAssignments = projectIds.map(projectId => ({
        taskId: taskId,
        projectId: projectId
      }))

      const createResult = await prisma.taskProjectAssignments.createMany({
        data: newAssignments
      })

      console.log('🗑️ Unassign projects - Created new assignments:', createResult.count)
    }

    // Verify the final state
    const finalTask = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        _count: {
          select: {
            projectAssignments: true
          }
        }
      }
    })

    console.log('🗑️ Unassign projects - Final project assignments count:', finalTask?._count.projectAssignments)

    return NextResponse.json({
      success: true,
      message: 'Project assignments updated successfully',
      taskId: taskId,
      remainingProjectIds: projectIds
    })

  } catch (error) {
    console.error('Error updating project assignments:', error)
    return NextResponse.json(
      { error: 'Failed to update project assignments' },
      { status: 500 }
    )
  }
}
