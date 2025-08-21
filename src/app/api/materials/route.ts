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
})

// GET - List materials for the company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR', 'WORKER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const materials = await prisma.material.findMany({
      where: {
        companyId: companyId,
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

    // Check if material name already exists in this company
    const existingMaterial = await prisma.material.findFirst({
      where: {
        companyId: companyId,
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

    const material = await prisma.material.create({
      data: {
        name: validatedData.name,
        nameEs: validatedData.nameEs,
        description: validatedData.description,
        unit: validatedData.unit,
        companyId: companyId,
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

    // Verify the material belongs to the user's company
    const existingMaterial = await prisma.material.findFirst({
      where: {
        id: id,
        companyId: companyId
      }
    })

    if (!existingMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Check if name is being updated and if it conflicts
    if (validatedData.name && validatedData.name !== existingMaterial.name) {
      const nameConflict = await prisma.material.findFirst({
        where: {
          companyId: companyId,
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

    const updatedMaterial = await prisma.material.update({
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
