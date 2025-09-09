import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'
import { createTaskProgressUpdate } from '@/lib/progressUtils'

// Vercel logging function
const logToVercel = (action: string, details: any = {}) => {
  console.log(`[VERCEL_LOG] ${action}:`, details)
  // In production, this will show up in Vercel logs
}

export const runtime = 'nodejs'

// Validation schema for progress update
const progressUpdateSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  amountCompleted: z.number().positive('Amount completed must be positive'),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OBSTACLE_PERMIT', 'OBSTACLE_DECISION', 'OBSTACLE_INSPECTION', 'OBSTACLE_MATERIALS', 'OBSTACLE_EQUIPMENT', 'OBSTACLE_WEATHER', 'OBSTACLE_OTHER']),
  additionalAttributes: z.string().max(100, 'Additional attributes must be 100 characters or less').optional(),
  materialConsumptions: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive('Quantity must be positive')
  })).optional(),
  materialLosses: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive('Quantity must be positive')
  })).optional(),
  photos: z.array(z.string().url()).optional(), // Array of S3 URLs
})

// POST - Log progress update
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id
  
  logToVercel('TASK_PROGRESS_POST_STARTED', {
    taskId,
    timestamp: new Date().toISOString()
  })

  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['WORKER'].includes(session.user?.role || '')) {
      logToVercel('TASK_PROGRESS_POST_UNAUTHORIZED', {
        taskId,
        userRole: session?.user?.role,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    logToVercel('TASK_PROGRESS_POST_REQUEST_BODY', {
      taskId,
      body,
      timestamp: new Date().toISOString()
    })

    const validatedData = progressUpdateSchema.parse(body)
    
    logToVercel('TASK_PROGRESS_POST_VALIDATION_SUCCESS', {
      taskId,
      validatedData,
      timestamp: new Date().toISOString()
    })

    // Use consolidated progress creation method
    const result = await createTaskProgressUpdate({
      taskId: taskId,
      projectId: validatedData.projectId,
      workerId: session.user?.id || '',
      amountCompleted: validatedData.amountCompleted,
      status: validatedData.status,
      additionalAttributes: validatedData.additionalAttributes,
      materialConsumptions: validatedData.materialConsumptions,
      materialLosses: validatedData.materialLosses,
      photos: validatedData.photos,
      isWorklogEntry: false
    })

    logToVercel('TASK_PROGRESS_POST_SUCCESS', {
      taskId,
      progressUpdateId: result.id,
      amountCompleted: result.amountCompleted,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Progress update logged successfully',
      progressUpdate: result
    })

  } catch (error) {
    logToVercel('TASK_PROGRESS_POST_ERROR', {
      taskId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to log progress update' },
      { status: 500 }
    )
  }
}

// GET - Get progress updates for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR', 'WORKER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Verify the task exists and get project assignments
    const taskAssignments = await prisma.taskProjectAssignments.findMany({
      where: {
        taskId: taskId,
        project: {
          companyId: companyId
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            nameEs: true
          }
        }
      }
    })

    if (taskAssignments.length === 0) {
      return NextResponse.json({ error: 'Task not found in your company' }, { status: 404 })
    }

    // If person is WORKER, verify they are assigned to the task in at least one project
    if (session.user?.role === 'WORKER') {
      const workerAssignment = await prisma.taskWorkerAssignments.findFirst({
        where: {
          taskId: taskId,
          workerId: session.user?.id,
          project: {
            companyId: companyId
          }
        }
      })

      if (!workerAssignment) {
        return NextResponse.json({ error: 'Task not assigned to you' }, { status: 403 })
      }
    }

    const progressUpdates = await prisma.taskProgressUpdates.findMany({
      where: { taskId: taskId },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            nameEs: true
          }
        },
        materialConsumptions: {
          include: {
            material: true
          }
        },
        materialLosses: {
          include: {
            material: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ progressUpdates })

  } catch (error) {
    console.error('Error fetching progress updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress updates' },
      { status: 500 }
    )
  }
}
