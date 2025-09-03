import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for material
const materialSchema = z.object({
  name: z.string().min(2, 'Material name must be at least 2 characters'),
  nameEs: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  unitCost: z.number().optional(),
  minStockLevel: z.number().optional(),
  maxStockLevel: z.number().optional(),
  currentStock: z.number().default(0),
})

// GET - List materials for the company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR', 'WORKER'].includes(session.user?.role || '')) {
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
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    const materials = await prisma.materials.findMany({
      where: {
        status: 'ACTIVE'
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ materials })

  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

// POST - Create new material
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = materialSchema.parse(body)
    
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

    // Check if material name already exists
    const existingMaterial = await prisma.materials.findFirst({
      where: {
        name: validatedData.name,
        status: 'ACTIVE'
      }
    })

    if (existingMaterial) {
      return NextResponse.json(
        { error: 'Material with this name already exists' },
        { status: 409 }
      )
    }

    const material = await prisma.materials.create({
      data: {
        name: validatedData.name,
        nameEs: validatedData.nameEs,
        description: validatedData.description,
        unit: validatedData.unit,
        unitCost: validatedData.unitCost,
        minStockLevel: validatedData.minStockLevel,
        maxStockLevel: validatedData.maxStockLevel,
        currentStock: validatedData.currentStock,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Material created successfully',
      material
    })

  } catch (error) {
    console.error('Error creating material:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    )
  }
}

// PUT - Update material
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    const validatedData = materialSchema.partial().parse(updateData)
    
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

    // Verify the material exists
    const existingMaterial = await prisma.materials.findFirst({
      where: {
        id: id,
      }
    })

    if (!existingMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Check if name is being updated and if it conflicts
    if (validatedData.name && validatedData.name !== existingMaterial.name) {
      const nameConflict = await prisma.materials.findFirst({
        where: {
          name: validatedData.name,
          status: 'ACTIVE',
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Material with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedMaterial = await prisma.materials.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      message: 'Material updated successfully',
      material: updatedMaterial
    })

  } catch (error) {
    console.error('Error updating material:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    )
  }
}

// DELETE - Delete material (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE /api/materials called')
    const session = await getServerSession(authOptions)
    
    console.log('🗑️ Session user role:', session?.user?.role)
    
    if (!session || session.user?.role !== 'ADMIN') {
      console.log('🗑️ Unauthorized - user role:', session?.user?.role)
      return NextResponse.json({ error: 'Only admins can delete materials' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('id')
    
    console.log('🗑️ Material ID to delete:', materialId)
    
    if (!materialId) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 })
    }

    const prisma = await getPrisma()

    // Check if material exists
    const existingMaterial = await prisma.materials.findUnique({
      where: { id: materialId },
      include: {
        _count: {
          select: {
            projectMaterials: true,
            consumptions: true,
            losses: true,
            inventoryMovements: true,
            reorderRequests: true,
            worklogUsage: true
          }
        }
      }
    })

    if (!existingMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Check if material has any usage (consumptions, losses, etc.)
    console.log('🗑️ Material usage counts:', {
      projectMaterials: existingMaterial._count.projectMaterials,
      consumptions: existingMaterial._count.consumptions,
      losses: existingMaterial._count.losses,
      inventoryMovements: existingMaterial._count.inventoryMovements,
      reorderRequests: existingMaterial._count.reorderRequests,
      worklogUsage: existingMaterial._count.worklogUsage
    })
    
    const hasUsage = 
      existingMaterial._count.projectMaterials > 0 ||
      existingMaterial._count.consumptions > 0 ||
      existingMaterial._count.losses > 0 ||
      existingMaterial._count.inventoryMovements > 0 ||
      existingMaterial._count.reorderRequests > 0 ||
      existingMaterial._count.worklogUsage > 0

    console.log('🗑️ Has usage:', hasUsage)

    if (hasUsage) {
      console.log('🗑️ Cannot delete - material has usage records')
      return NextResponse.json({ 
        error: 'Cannot delete material - it has usage records (consumptions, losses, inventory movements, etc.). These records must be preserved for audit and historical purposes.',
        details: {
          projectMaterials: existingMaterial._count.projectMaterials,
          consumptions: existingMaterial._count.consumptions,
          losses: existingMaterial._count.losses,
          inventoryMovements: existingMaterial._count.inventoryMovements,
          reorderRequests: existingMaterial._count.reorderRequests,
          worklogUsage: existingMaterial._count.worklogUsage
        }
      }, { status: 400 })
    }

    // Delete the material (safe to delete since no usage)
    console.log('🗑️ Deleting material...')
    await prisma.materials.delete({
      where: { id: materialId }
    })
    console.log('🗑️ Material deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully',
      deletedMaterialId: materialId
    })

  } catch (error) {
    console.error('🗑️ Error deleting material:', error)
    console.error('🗑️ Error type:', typeof error)
    console.error('🗑️ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('🗑️ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('🗑️ Prisma error code:', (error as any).code)
      console.error('🗑️ Prisma error meta:', (error as any).meta)
    }
    
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    )
  }
}
