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
    
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
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
    
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
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
