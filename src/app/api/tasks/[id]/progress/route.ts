import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for progress update
const progressUpdateSchema = z.object({
  amountCompleted: z.number().positive('Amount completed must be positive'),
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
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['WORKER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = progressUpdateSchema.parse(body)
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

    // Verify the task exists and is assigned to the user
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          companyId: companyId
        },
        assignedUsers: {
          some: {
            userId: session.user?.id,
            status: 'ACTIVE'
          }
        }
      },
      include: {
        taskMaterials: {
          include: {
            material: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found or not assigned to you' }, { status: 404 })
    }

    // Verify materials belong to the task if provided
    if (validatedData.materialConsumptions) {
      const taskMaterialIds = task.taskMaterials.map(tm => tm.materialId)
      const consumptionMaterialIds = validatedData.materialConsumptions.map(mc => mc.materialId)
      
      const invalidMaterials = consumptionMaterialIds.filter(id => !taskMaterialIds.includes(id))
      if (invalidMaterials.length > 0) {
        return NextResponse.json({ 
          error: 'Some materials are not associated with this task' 
        }, { status: 400 })
      }
    }

    if (validatedData.materialLosses) {
      const taskMaterialIds = task.taskMaterials.map(tm => tm.materialId)
      const lossMaterialIds = validatedData.materialLosses.map(ml => ml.materialId)
      
      const invalidMaterials = lossMaterialIds.filter(id => !taskMaterialIds.includes(id))
      if (invalidMaterials.length > 0) {
        return NextResponse.json({ 
          error: 'Some materials are not associated with this task' 
        }, { status: 400 })
      }
    }

    // Create progress update with materials in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the progress update
      const progressUpdate = await tx.taskProgressUpdate.create({
        data: {
          taskId: taskId,
          userId: session.user?.id || '',
          amountCompleted: validatedData.amountCompleted,
          additionalAttributes: validatedData.additionalAttributes,
          photos: validatedData.photos || [],
        }
      })

      // Add material consumptions if provided
      if (validatedData.materialConsumptions && validatedData.materialConsumptions.length > 0) {
        await tx.materialConsumption.createMany({
          data: validatedData.materialConsumptions.map(mc => ({
            taskProgressUpdateId: progressUpdate.id,
            materialId: mc.materialId,
            quantity: mc.quantity
          }))
        })
      }

      // Add material losses if provided
      if (validatedData.materialLosses && validatedData.materialLosses.length > 0) {
        await tx.materialLoss.createMany({
          data: validatedData.materialLosses.map(ml => ({
            taskProgressUpdateId: progressUpdate.id,
            materialId: ml.materialId,
            quantity: ml.quantity
          }))
        })
      }

      return progressUpdate
    })

    return NextResponse.json({
      success: true,
      message: 'Progress update logged successfully',
      progressUpdate: result
    })

  } catch (error) {
    console.error('Error logging progress update:', error)
    
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

    // If user is WORKER, verify they are assigned to the task
    if (session.user?.role === 'WORKER') {
      const assignment = await prisma.userTask.findFirst({
        where: {
          taskId: taskId,
          userId: session.user?.id,
          status: 'ACTIVE'
        }
      })

      if (!assignment) {
        return NextResponse.json({ error: 'Task not assigned to you' }, { status: 403 })
      }
    }

    const progressUpdates = await prisma.taskProgressUpdate.findMany({
      where: { taskId: taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
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
