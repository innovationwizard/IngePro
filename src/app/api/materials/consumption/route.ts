import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for material consumption tracking
const consumptionTrackingSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  materialId: z.string().min(1, 'Material ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  type: z.enum(['CONSUMPTION', 'LOSS']),
  notes: z.string().optional(),
  date: z.string().optional(), // ISO date string, defaults to now
})

// POST - Log material consumption/loss for a project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = consumptionTrackingSchema.parse(body)
    
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

    // Verify project belongs to person's company
    const project = await prisma.projects.findFirst({
      where: {
        id: validatedData.projectId,
        companyId: companyId
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify material is assigned to the project
    const projectMaterial = await prisma.projectMaterials.findFirst({
      where: {
        projectId: validatedData.projectId,
        materialId: validatedData.materialId
      }
    })

    if (!projectMaterial) {
      return NextResponse.json({ error: 'Material not assigned to this project' }, { status: 400 })
    }

    // Create consumption/loss record
    const consumptionRecord = await prisma.materialConsumptions.create({
      data: {
        taskProgressUpdateId: '', // Will be empty for manual tracking
        materialId: validatedData.materialId,
        quantity: validatedData.quantity,
        notes: validatedData.notes,
        recordedAt: validatedData.date ? new Date(validatedData.date) : new Date(),
        recordedBy: session.user?.id || '',
        projectId: validatedData.projectId,
        type: validatedData.type
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Material consumption recorded successfully',
      consumptionRecord
    })

  } catch (error) {
    console.error('Error recording material consumption:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to record material consumption' },
      { status: 500 }
    )
  }
}

// GET - Get material consumption/loss for projects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const materialId = searchParams.get('materialId')
    const type = searchParams.get('type') // CONSUMPTION, LOSS, or both
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
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

    // Build where clause
    const whereClause: any = {
      project: {
        companyId: companyId
      }
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (materialId) {
      whereClause.materialId = materialId
    }

    if (type && type !== 'BOTH') {
      whereClause.type = type
    }

    if (startDate || endDate) {
      whereClause.recordedAt = {}
      if (startDate) whereClause.recordedAt.gte = new Date(startDate)
      if (endDate) whereClause.recordedAt.lte = new Date(endDate)
    }

    // Get consumption records
    const consumptionRecords = await prisma.materialConsumptions.findMany({
      where: whereClause,
      include: {
        material: {
          select: {
            id: true,
            name: true,
            nameEs: true,
            unit: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            nameEs: true
          }
        }
      },
      orderBy: { recordedAt: 'desc' }
    })

    // Get loss records
    const lossRecords = await prisma.materialLosses.findMany({
      where: whereClause,
      include: {
        material: {
          select: {
            id: true,
            name: true,
            nameEs: true,
            unit: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            nameEs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate totals
    const totalConsumption = consumptionRecords.reduce((sum, record) => sum + record.quantity, 0)
    const totalLoss = lossRecords.reduce((sum, record) => sum + record.quantity, 0)

    return NextResponse.json({
      consumptionRecords,
      lossRecords,
      totals: {
        consumption: totalConsumption,
        loss: totalLoss,
        total: totalConsumption + totalLoss
      }
    })

  } catch (error) {
    console.error('Error fetching material consumption:', error)
    return NextResponse.json(
      { error: 'Failed to fetch material consumption' },
      { status: 500 }
    )
  }
}
