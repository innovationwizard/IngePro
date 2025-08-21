import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

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
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = validationSchema.parse(body)
    const progressUpdateId = params.id
    
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

    // Get the progress update with task and project context
    const progressUpdate = await prisma.taskProgressUpdate.findFirst({
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
      return NextResponse.json({ error: 'Progress update not found' }, { status: 404 })
    }

    // Verify the progress update is pending validation
    if (progressUpdate.validationStatus !== 'PENDING') {
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
    const result = await prisma.$transaction(async (tx) => {
      let validationStatus: 'VALIDATED' | 'REJECTED' = 'VALIDATED'
      
      if (validatedData.action === 'REJECT') {
        validationStatus = 'REJECTED'
      }

      // Update the progress update
      const updatedProgressUpdate = await tx.taskProgressUpdate.update({
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
          await tx.taskProgressUpdate.update({
            where: { id: progressUpdateId },
            data: {
              amountCompleted: validatedData.modifiedAmount
            }
          })
        }

        // Update material consumptions if provided
        if (validatedData.modifiedMaterialConsumptions) {
          // Remove existing consumptions
          await tx.materialConsumption.deleteMany({
            where: { taskProgressUpdateId: progressUpdateId }
          })

          // Add new consumptions
          if (validatedData.modifiedMaterialConsumptions.length > 0) {
            await tx.materialConsumption.createMany({
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
          await tx.materialLoss.deleteMany({
            where: { taskProgressUpdateId: progressUpdateId }
          })

          // Add new losses
          if (validatedData.modifiedMaterialLosses.length > 0) {
            await tx.materialLoss.createMany({
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

    return NextResponse.json({
      success: true,
      message: `Progress update ${validatedData.action.toLowerCase()}ed successfully`,
      progressUpdate: result
    })

  } catch (error) {
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
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const progressUpdateId = params.id
    
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

    const progressUpdate = await prisma.taskProgressUpdate.findFirst({
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
      return NextResponse.json({ error: 'Progress update not found' }, { status: 404 })
    }

    return NextResponse.json({ progressUpdate })

  } catch (error) {
    console.error('Error fetching progress update for validation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress update' },
      { status: 500 }
    )
  }
}
