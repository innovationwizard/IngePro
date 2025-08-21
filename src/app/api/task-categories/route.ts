import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for task category
const taskCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  nameEs: z.string().optional(),
  description: z.string().optional(),
})

// GET - List task categories for the company
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

    const taskCategories = await prisma.taskCategory.findMany({
      where: {
        companyId: companyId,
        status: 'ACTIVE'
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ taskCategories })

  } catch (error) {
    console.error('Error fetching task categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task categories' },
      { status: 500 }
    )
  }
}

// POST - Create new task category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = taskCategorySchema.parse(body)
    
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

    // Check if category name already exists in this company
    const existingCategory = await prisma.taskCategory.findFirst({
      where: {
        companyId: companyId,
        name: validatedData.name,
        status: 'ACTIVE'
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Task category with this name already exists' },
        { status: 409 }
      )
    }

    const taskCategory = await prisma.taskCategory.create({
      data: {
        name: validatedData.name,
        nameEs: validatedData.nameEs,
        description: validatedData.description,
        companyId: companyId,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Task category created successfully',
      taskCategory
    })

  } catch (error) {
    console.error('Error creating task category:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create task category' },
      { status: 500 }
    )
  }
}

// PUT - Update task category
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    const validatedData = taskCategorySchema.partial().parse(updateData)
    
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

    // Verify the task category belongs to the user's company
    const existingCategory = await prisma.taskCategory.findFirst({
      where: {
        id: id,
        companyId: companyId
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Task category not found' }, { status: 404 })
    }

    // Check if name is being updated and if it conflicts
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.taskCategory.findFirst({
        where: {
          companyId: companyId,
          name: validatedData.name,
          status: 'ACTIVE',
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Task category with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedCategory = await prisma.taskCategory.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      message: 'Task category updated successfully',
      taskCategory: updatedCategory
    })

  } catch (error) {
    console.error('Error updating task category:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update task category' },
      { status: 500 }
    )
  }
}
