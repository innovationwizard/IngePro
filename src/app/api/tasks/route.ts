import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for task
const taskSchema = z.object({
  name: z.string().min(2, 'Task name must be at least 2 characters'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  projectId: z.string().min(1, 'Project is required'),
  progressUnit: z.string().min(1, 'Progress unit is required'),
  materialIds: z.array(z.string()).optional(), // Array of material IDs
})

// GET - List tasks for the user's projects
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')

    // Build where clause
    const whereClause: any = {
      project: {
        companyId: companyId
      }
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    if (status) {
      whereClause.status = status
    }

    // If user is WORKER, only show tasks assigned to them
    if (session.user?.role === 'WORKER') {
      whereClause.assignedUsers = {
        some: {
          userId: session.user?.id,
          status: 'ACTIVE'
        }
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        category: true,
        project: {
          select: {
            id: true,
            name: true,
            nameEs: true
          }
        },
        assignedUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        taskMaterials: {
          include: {
            material: true
          }
        },
        progressUpdates: {
          include: {
            user: {
              select: {
                id: true,
                name: true
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
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            progressUpdates: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tasks })

  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST - Create new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = taskSchema.parse(body)
    
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

    // Verify category belongs to user's company
    const category = await prisma.taskCategory.findFirst({
      where: {
        id: validatedData.categoryId,
        companyId: companyId
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Task category not found' }, { status: 404 })
    }

    // Create task with materials in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the task
      const task = await tx.task.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          categoryId: validatedData.categoryId,
          projectId: validatedData.projectId,
          progressUnit: validatedData.progressUnit,
        }
      })

      // Add materials to task if provided
      if (validatedData.materialIds && validatedData.materialIds.length > 0) {
        // Verify all materials belong to the company
        const materials = await tx.material.findMany({
          where: {
            id: { in: validatedData.materialIds },
            companyId: companyId
          }
        })

        if (materials.length !== validatedData.materialIds.length) {
          throw new Error('Some materials not found')
        }

        // Create task-material relationships
        await tx.taskMaterial.createMany({
          data: validatedData.materialIds.map(materialId => ({
            taskId: task.id,
            materialId: materialId
          }))
        })
      }

      return task
    })

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task: result
    })

  } catch (error) {
    console.error('Error creating task:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// PUT - Update task
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    const validatedData = taskSchema.partial().parse(updateData)
    
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
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        project: {
          companyId: companyId
        }
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        projectId: validatedData.projectId,
        progressUnit: validatedData.progressUnit,
      }
    })

    // Update materials if provided
    if (validatedData.materialIds) {
      // Remove existing materials
      await prisma.taskMaterial.deleteMany({
        where: { taskId: id }
      })

      // Add new materials
      if (validatedData.materialIds.length > 0) {
        await prisma.taskMaterial.createMany({
          data: validatedData.materialIds.map(materialId => ({
            taskId: id,
            materialId: materialId
          }))
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    })

  } catch (error) {
    console.error('Error updating task:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
