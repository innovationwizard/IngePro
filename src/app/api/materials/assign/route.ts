import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for material assignment
const materialAssignmentSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  materialIds: z.array(z.string()).min(1, 'At least one material is required'),
})

// POST - Assign materials to project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = materialAssignmentSchema.parse(body)
    
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

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        companyId: companyId
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify all materials exist
    const materials = await prisma.material.findMany({
      where: {
        id: { in: validatedData.materialIds },
        status: 'ACTIVE'
      }
    })

    if (materials.length !== validatedData.materialIds.length) {
      return NextResponse.json({ error: 'Some materials not found' }, { status: 404 })
    }

    // Create material assignments in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create project-material relationships
      const materialAssignments = await tx.projectMaterial.createMany({
        data: validatedData.materialIds.map(materialId => ({
          projectId: validatedData.projectId,
          materialId: materialId
        })),
        skipDuplicates: true // Skip if already assigned
      })

      return materialAssignments
    })

    return NextResponse.json({
      success: true,
      message: 'Materials assigned to project successfully',
      result
    })

  } catch (error) {
    console.error('Error assigning materials:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to assign materials' },
      { status: 500 }
    )
  }
}
