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
    let companyId: string | undefined = session.user?.companyId
    
    if (!companyId) {
      const personTenant = await prisma.personTenants.findFirst({
        where: {
          personId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      })
      companyId = personTenant?.companyId || undefined
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    const materials = await prisma.materials.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null // Exclude soft-deleted materials
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
    let companyId: string | undefined = session.user?.companyId
    
    if (!companyId) {
      const personTenant = await prisma.personTenants.findFirst({
        where: {
          personId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      })
      companyId = personTenant?.companyId || undefined
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    // Check if material name already exists (excluding soft-deleted materials)
    const existingMaterial = await prisma.materials.findFirst({
      where: {
        name: validatedData.name,
        status: 'ACTIVE',
        deletedAt: null // Exclude soft-deleted materials
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
        { error: 'Validation failed', details: error.issues },
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
    let companyId: string | undefined = session.user?.companyId
    
    if (!companyId) {
      const personTenant = await prisma.personTenants.findFirst({
        where: {
          personId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      })
      companyId = personTenant?.companyId || undefined
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    // Verify the material exists and is not soft-deleted
    const existingMaterial = await prisma.materials.findFirst({
      where: {
        id: id,
        deletedAt: null // Only allow updates on non-deleted materials
      }
    })

    if (!existingMaterial) {
      return NextResponse.json({ error: 'Material not found or has been deleted' }, { status: 404 })
    }

    // Check if name is being updated and if it conflicts
    if (validatedData.name && validatedData.name !== existingMaterial.name) {
      const nameConflict = await prisma.materials.findFirst({
        where: {
          name: validatedData.name,
          status: 'ACTIVE',
          deletedAt: null, // Exclude soft-deleted materials
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
        { error: 'Validation failed', details: error.issues },
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
      where: { id: materialId }
    })

    if (!existingMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // TODO: Add usage checking once production database is fully synced
    console.log('🗑️ Material found:', existingMaterial.name)

    // Hard delete the material (temporary until production database is updated)
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
