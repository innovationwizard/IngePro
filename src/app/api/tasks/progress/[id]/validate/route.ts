import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

// Vercel logging function
const logToVercel = (action: string, details: any = {}) => {
  console.log(`[VERCEL_LOG] ${action}:`, details)
  // In production, this will show up in Vercel logs
}

export const runtime = 'nodejs'

// Validation schema for progress validation
const validationSchema = z.object({
  action: z.enum(['ACCEPT', 'MODIFY', 'REJECT']),
  comments: z.string().optional(),
  modifiedAmount: z.number().positive('Modified amount must be positive').optional(),
  modifiedMaterialConsumptions: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive('Quantity must be positive')
  })).optional(),
  modifiedMaterialLosses: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive('Quantity must be positive')
  })).optional(),
})

// POST - Validate progress update
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const progressUpdateId = params.id
  
  logToVercel('PROGRESS_VALIDATION_POST_STARTED', {
    progressUpdateId,
    timestamp: new Date().toISOString()
  })

  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      logToVercel('PROGRESS_VALIDATION_POST_UNAUTHORIZED', {
        progressUpdateId,
        userRole: session?.user?.role,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    logToVercel('PROGRESS_VALIDATION_POST_REQUEST_BODY', {
      progressUpdateId,
      body,
      timestamp: new Date().toISOString()
    })

    const validatedData = validationSchema.parse(body)
    
    logToVercel('PROGRESS_VALIDATION_POST_VALIDATION_SUCCESS', {
      progressUpdateId,
      validatedData,
      timestamp: new Date().toISOString()
    })
    
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
      logToVercel('PROGRESS_VALIDATION_POST_NO_COMPANY', {
        progressUpdateId,
        userId: session.user?.id,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    // Get the progress update with task and project context
    logToVercel('PROGRESS_VALIDATION_POST_FETCHING_UPDATE', {
      progressUpdateId,
      companyId,
      timestamp: new Date().toISOString()
    })

    const progressUpdate = await prisma.taskProgressUpdates.findFirst({
      where: {
        id: progressUpdateId,
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
        },
        worker: {
          select: {
            id: true,
            name: true
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
      }
    })

    if (!progressUpdate) {
      logToVercel('PROGRESS_VALIDATION_POST_UPDATE_NOT_FOUND', {
        progressUpdateId,
        companyId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Progress update not found' }, { status: 404 })
    }

    logToVercel('PROGRESS_VALIDATION_POST_UPDATE_FOUND', {
      progressUpdateId,
      taskId: progressUpdate.taskId,
      projectId: progressUpdate.projectId,
      workerId: progressUpdate.workerId,
      currentValidationStatus: progressUpdate.validationStatus,
      amountCompleted: progressUpdate.amountCompleted,
      timestamp: new Date().toISOString()
    })

    // Verify the progress update is pending validation
    if (progressUpdate.validationStatus !== 'PENDING') {
      logToVercel('PROGRESS_VALIDATION_POST_ALREADY_VALIDATED', {
        progressUpdateId,
        currentValidationStatus: progressUpdate.validationStatus,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Progress update has already been validated' }, { status: 400 })
    }

    // Validate materials if modifying
    if (validatedData.action === 'MODIFY') {
      if (validatedData.modifiedMaterialConsumptions) {
        const projectMaterialIds = progressUpdate.project.materials.map(pm => pm.materialId)
        const consumptionMaterialIds = validatedData.modifiedMaterialConsumptions.map(mc => mc.materialId)
        
        const invalidMaterials = consumptionMaterialIds.filter(id => !projectMaterialIds.includes(id))
        if (invalidMaterials.length > 0) {
          return NextResponse.json({ 
            error: 'Some materials are not available in this project' 
          }, { status: 400 })
        }
      }

      if (validatedData.modifiedMaterialLosses) {
        const projectMaterialIds = progressUpdate.project.materials.map(pm => pm.materialId)
        const lossMaterialIds = validatedData.modifiedMaterialLosses.map(ml => ml.materialId)
        
        const invalidMaterials = lossMaterialIds.filter(id => !projectMaterialIds.includes(id))
        if (invalidMaterials.length > 0) {
          return NextResponse.json({ 
            error: 'Some materials are not available in this project' 
          }, { status: 400 })
        }
      }
    }

    // Process validation in transaction
    logToVercel('PROGRESS_VALIDATION_POST_STARTING_TRANSACTION', {
      progressUpdateId,
      action: validatedData.action,
      timestamp: new Date().toISOString()
    })

    const result = await prisma.$transaction(async (tx) => {
      let validationStatus: 'VALIDATED' | 'REJECTED' = 'VALIDATED'
      
      if (validatedData.action === 'REJECT') {
        validationStatus = 'REJECTED'
      }

      logToVercel('PROGRESS_VALIDATION_POST_TRANSACTION_STATUS', {
        progressUpdateId,
        validationStatus,
        action: validatedData.action,
        timestamp: new Date().toISOString()
      })

      // Update the progress update
      const updatedProgressUpdate = await tx.taskProgressUpdates.update({
        where: { id: progressUpdateId },
        data: {
          validationStatus: validationStatus,
          validatedBy: session.user?.id || '',
          validatedAt: new Date(),
          validationComments: validatedData.comments,
        }
      })

      // If modifying, update the amounts and materials
      if (validatedData.action === 'MODIFY') {
        // Update amount if provided
        if (validatedData.modifiedAmount !== undefined) {
          await tx.taskProgressUpdates.update({
            where: { id: progressUpdateId },
            data: {
              amountCompleted: validatedData.modifiedAmount
            }
          })
        }

        // Update material consumptions if provided
        if (validatedData.modifiedMaterialConsumptions) {
          // Remove existing consumptions
          await tx.materialConsumptions.deleteMany({
            where: { taskProgressUpdateId: progressUpdateId }
          })

          // Add new consumptions
          if (validatedData.modifiedMaterialConsumptions.length > 0) {
            await tx.materialConsumptions.createMany({
              data: validatedData.modifiedMaterialConsumptions.map(mc => ({
                taskProgressUpdateId: progressUpdateId,
                materialId: mc.materialId,
                quantity: mc.quantity
              }))
            })
          }
        }

        // Update material losses if provided
        if (validatedData.modifiedMaterialLosses) {
          // Remove existing losses
          await tx.materialLosses.deleteMany({
            where: { taskProgressUpdateId: progressUpdateId }
          })

          // Add new losses
          if (validatedData.modifiedMaterialLosses.length > 0) {
            await tx.materialLosses.createMany({
              data: validatedData.modifiedMaterialLosses.map(ml => ({
                taskProgressUpdateId: progressUpdateId,
                materialId: ml.materialId,
                quantity: ml.quantity
              }))
            })
          }
        }
      }

      return updatedProgressUpdate
    })

    logToVercel('PROGRESS_VALIDATION_POST_SUCCESS', {
      progressUpdateId,
      action: validatedData.action,
      validationStatus: result.validationStatus,
      validatedBy: result.validatedBy,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Progress update ${validatedData.action.toLowerCase()}ed successfully`,
      progressUpdate: result
    })

  } catch (error) {
    logToVercel('PROGRESS_VALIDATION_POST_ERROR', {
      progressUpdateId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    console.error('Error validating progress update:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to validate progress update' },
      { status: 500 }
    )
  }
}

// GET - Get validation details for a progress update
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const progressUpdateId = params.id
  
  logToVercel('PROGRESS_VALIDATION_GET_STARTED', {
    progressUpdateId,
    timestamp: new Date().toISOString()
  })

  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      logToVercel('PROGRESS_VALIDATION_GET_UNAUTHORIZED', {
        progressUpdateId,
        userRole: session?.user?.role,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      logToVercel('PROGRESS_VALIDATION_GET_NO_COMPANY', {
        progressUpdateId,
        userId: session.user?.id,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    const progressUpdate = await prisma.taskProgressUpdates.findFirst({
      where: {
        id: progressUpdateId,
        project: {
          companyId: companyId
        }
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            nameEs: true
          }
        },
        task: {
          include: {
            category: true
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
      }
    })

    if (!progressUpdate) {
      logToVercel('PROGRESS_VALIDATION_GET_NOT_FOUND', {
        progressUpdateId,
        companyId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Progress update not found' }, { status: 404 })
    }

    logToVercel('PROGRESS_VALIDATION_GET_SUCCESS', {
      progressUpdateId,
      taskId: progressUpdate.taskId,
      projectId: progressUpdate.projectId,
      workerId: progressUpdate.workerId,
      validationStatus: progressUpdate.validationStatus,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ progressUpdate })

  } catch (error) {
    logToVercel('PROGRESS_VALIDATION_GET_ERROR', {
      progressUpdateId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    console.error('Error fetching progress update for validation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress update' },
      { status: 500 }
    )
  }
}
