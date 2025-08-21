import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Get inventory movements with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
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

    // Build where clause
    const whereClause: any = {
      material: {
        projectMaterials: {
          some: {
            project: {
              companyId: companyId
            }
          }
        }
      }
    }

    if (materialId) {
      whereClause.materialId = materialId
    }

    if (type) {
      whereClause.type = type
    }

    if (startDate || endDate) {
      whereClause.recordedAt = {}
      if (startDate) whereClause.recordedAt.gte = new Date(startDate)
      if (endDate) whereClause.recordedAt.lte = new Date(endDate)
    }

    const movements = await prisma.inventoryMovement.findMany({
      where: whereClause,
      include: {
        material: true
      },
      orderBy: {
        recordedAt: 'desc'
      }
    })

    // Calculate summary statistics
    const summary = {
      totalMovements: movements.length,
      totalQuantity: movements.reduce((sum, movement) => sum + movement.quantity, 0),
      totalCost: movements.reduce((sum, movement) => sum + (movement.totalCost || 0), 0),
      byType: movements.reduce((acc, movement) => {
        if (!acc[movement.type]) {
          acc[movement.type] = {
            count: 0,
            quantity: 0,
            cost: 0
          }
        }
        acc[movement.type].count += 1
        acc[movement.type].quantity += movement.quantity
        acc[movement.type].cost += movement.totalCost || 0
        return acc
      }, {} as Record<string, any>)
    }

    return NextResponse.json({
      movements,
      summary
    })

  } catch (error) {
    console.error('Error fetching inventory movements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory movements' },
      { status: 500 }
    )
  }
}

// POST - Create new inventory movement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { materialId, type, quantity, unitCost, reference, notes } = body

    if (!materialId || !type || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: materialId, type, quantity' },
        { status: 400 }
      )
    }

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

    // Verify material belongs to company
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        projectMaterials: {
          some: {
            project: {
              companyId: companyId
            }
          }
        }
      }
    })

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found or not accessible' },
        { status: 404 }
      )
    }

    // Calculate total cost
    const totalCost = unitCost ? quantity * unitCost : null

    // Create inventory movement
    const movement = await prisma.inventoryMovement.create({
      data: {
        materialId,
        type,
        quantity,
        unitCost,
        totalCost,
        reference,
        notes,
        recordedBy: session.user?.id
      },
      include: {
        material: true
      }
    })

    // Update material stock level
    const newStock = material.currentStock + quantity
    await prisma.material.update({
      where: { id: materialId },
      data: { currentStock: newStock }
    })

    return NextResponse.json({
      message: 'Inventory movement created successfully',
      movement,
      newStock
    })

  } catch (error) {
    console.error('Error creating inventory movement:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory movement' },
      { status: 500 }
    )
  }
}
