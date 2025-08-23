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

// GET - List all task categories (universal)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR', 'WORKER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    
    const taskCategories = await prisma.taskCategories.findMany({
      where: {
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

// POST - Create new task category (universal)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = taskCategorySchema.parse(body)
    
    const prisma = await getPrisma()
    
    // Check if category name already exists globally
    const existingCategory = await prisma.taskCategories.findFirst({
      where: {
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

    const taskCategory = await prisma.taskCategories.create({
      data: {
        name: validatedData.name,
        nameEs: validatedData.nameEs,
        description: validatedData.description,
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
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create task category' },
      { status: 500 }
    )
  }
}

// PUT - Update task category (universal)
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

    // Verify the task category exists
    const existingCategory = await prisma.taskCategories.findFirst({
      where: {
        id: id,
        status: 'ACTIVE'
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Task category not found' }, { status: 404 })
    }

    // Check if name is being updated and if it conflicts
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.taskCategories.findFirst({
        where: {
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

    const updatedCategory = await prisma.taskCategories.update({
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
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update task category' },
      { status: 500 }
    )
  }
}
