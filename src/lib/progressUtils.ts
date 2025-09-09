import { getPrisma } from '@/lib/prisma'

// Vercel logging function
const logToVercel = (action: string, details: any = {}) => {
  console.log(`[VERCEL_LOG] ${action}:`, details)
  // In production, this will show up in Vercel logs
}

export interface ProgressCreationData {
  taskId: string
  projectId: string
  workerId: string
  amountCompleted: number
  status?: string
  additionalAttributes?: string
  materialConsumptions?: Array<{
    materialId: string
    quantity: number
  }>
  materialLosses?: Array<{
    materialId: string
    quantity: number
  }>
  photos?: string[]
  isWorklogEntry?: boolean
  worklogId?: string
}

/**
 * Consolidated progress creation function that ensures all progress updates
 * are created with proper assignment linking and validation setup
 */
export async function createTaskProgressUpdate(data: ProgressCreationData) {
  const prisma = await getPrisma()
  
  logToVercel('PROGRESS_CREATION_STARTED', {
    taskId: data.taskId,
    projectId: data.projectId,
    workerId: data.workerId,
    amountCompleted: data.amountCompleted,
    isWorklogEntry: data.isWorklogEntry,
    worklogId: data.worklogId,
    timestamp: new Date().toISOString()
  })

  try {
    // Get person's company context
    let companyId: string | null = null
    
    // Try to get company from worker
    const worker = await prisma.people.findUnique({
      where: { id: data.workerId },
      select: { companyId: true }
    })
    companyId = worker?.companyId || null

    if (!companyId) {
      // Fallback: get from project
      const project = await prisma.projects.findUnique({
        where: { id: data.projectId },
        select: { companyId: true }
      })
      companyId = project?.companyId || null
    }

    if (!companyId) {
      logToVercel('PROGRESS_CREATION_FAILED_NO_COMPANY', {
        taskId: data.taskId,
        projectId: data.projectId,
        workerId: data.workerId,
        timestamp: new Date().toISOString()
      })
      throw new Error('No company context available for progress creation')
    }

    // Verify the task exists and is assigned to the worker for this project
    const workerAssignment = await prisma.taskWorkerAssignments.findFirst({
      where: {
        taskId: data.taskId,
        projectId: data.projectId,
        workerId: data.workerId,
        project: {
          companyId: companyId
        }
      },
      include: {
        task: {
          include: {
            category: true
          }
        },
        project: {
          include: {
            materials: {
              include: {
                material: true
              }
            }
          }
        }
      }
    })

    if (!workerAssignment) {
      logToVercel('PROGRESS_CREATION_FAILED_NO_ASSIGNMENT', {
        taskId: data.taskId,
        projectId: data.projectId,
        workerId: data.workerId,
        companyId,
        timestamp: new Date().toISOString()
      })
      throw new Error('Task not found or not assigned to worker for this project')
    }

    logToVercel('PROGRESS_CREATION_ASSIGNMENT_FOUND', {
      assignmentId: workerAssignment.id,
      taskName: workerAssignment.task.name,
      projectName: workerAssignment.project.name,
      timestamp: new Date().toISOString()
    })

    // Check if there's an existing progress update for today
    const existingProgress = await prisma.taskProgressUpdates.findFirst({
      where: {
        taskId: data.taskId,
        projectId: data.projectId,
        workerId: data.workerId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
        }
      }
    })

    let progressUpdate

    if (existingProgress && data.isWorklogEntry) {
      // For worklog entries, update existing progress
      logToVercel('PROGRESS_CREATION_UPDATING_EXISTING', {
        existingProgressId: existingProgress.id,
        currentAmount: existingProgress.amountCompleted,
        additionalAmount: data.amountCompleted,
        newTotal: existingProgress.amountCompleted + data.amountCompleted,
        timestamp: new Date().toISOString()
      })

      progressUpdate = await prisma.taskProgressUpdates.update({
        where: { id: existingProgress.id },
        data: {
          amountCompleted: existingProgress.amountCompleted + data.amountCompleted,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new progress update
      logToVercel('PROGRESS_CREATION_CREATING_NEW', {
        taskId: data.taskId,
        projectId: data.projectId,
        workerId: data.workerId,
        assignmentId: workerAssignment.id,
        amountCompleted: data.amountCompleted,
        status: data.status || 'IN_PROGRESS',
        timestamp: new Date().toISOString()
      })

      const result = await prisma.$transaction(async (tx) => {
        // Create the progress update
        const progressUpdate = await tx.taskProgressUpdates.create({
          data: {
            taskId: data.taskId,
            projectId: data.projectId,
            workerId: data.workerId,
            assignmentId: workerAssignment.id, // This is the key fix!
            amountCompleted: data.amountCompleted,
            status: data.status || 'IN_PROGRESS',
            additionalAttributes: data.additionalAttributes,
            photos: data.photos || [],
          }
        })

        // Add material consumptions if provided
        if (data.materialConsumptions && data.materialConsumptions.length > 0) {
          await tx.materialConsumptions.createMany({
            data: data.materialConsumptions.map(mc => ({
              taskProgressUpdateId: progressUpdate.id,
              materialId: mc.materialId,
              quantity: mc.quantity
            }))
          })
        }

        // Add material losses if provided
        if (data.materialLosses && data.materialLosses.length > 0) {
          await tx.materialLoss.createMany({
            data: data.materialLosses.map(ml => ({
              taskProgressUpdateId: progressUpdate.id,
              materialId: ml.materialId,
              quantity: ml.quantity
            }))
          })
        }

        return progressUpdate
      })

      progressUpdate = result
    }

    logToVercel('PROGRESS_CREATION_SUCCESS', {
      progressUpdateId: progressUpdate.id,
      taskId: data.taskId,
      projectId: data.projectId,
      workerId: data.workerId,
      amountCompleted: progressUpdate.amountCompleted,
      validationStatus: 'PENDING',
      timestamp: new Date().toISOString()
    })

    return progressUpdate

  } catch (error) {
    logToVercel('PROGRESS_CREATION_ERROR', {
      taskId: data.taskId,
      projectId: data.projectId,
      workerId: data.workerId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    throw error
  }
}
