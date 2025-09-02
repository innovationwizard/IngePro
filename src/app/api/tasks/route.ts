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
  categoryId: z.string().min(1, 'Category is required').optional(),
  progressUnit: z.string().min(1, 'Unit of measure is required'),
  materialIds: z.array(z.string()).optional(), // Array of material IDs
})

// GET - List tasks for the person's projects
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')

    // Build where clause - tasks are universal
    const whereClause: any = {}

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    // If person is WORKER, only show tasks assigned to them
    if (session.user?.role === 'WORKER') {
      // Get tasks assigned to this worker through TaskWorkerAssignments
      const workerAssignments = await prisma.taskWorkerAssignments.findMany({
        where: {
          workerId: session.user?.id,
          project: {
            companyId: companyId
          }
        },
        include: {
          task: {
            include: {
              category: true,
              projectAssignments: {
                include: {
                  project: {
                    select: {
                      id: true,
                      name: true,
                      nameEs: true
                    }
                  }
                }
              },
              workerAssignments: {
                include: {
                  worker: {
                    select: {
                      id: true,
                      name: true,
                      role: true
                    }
                  },
                  project: {
                    select: {
                      id: true,
                      name: true,
                      nameEs: true
                    }
                  }
                }
              },
              progressUpdates: {
                include: {
                  worker: {
                    select: {
                      id: true,
                      name: true
                    }
                  },
                  project: {
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
            }
          }
        }
      })
      
      // Return tasks with full data structure including workerAssignments
      return NextResponse.json({ 
        tasks: workerAssignments.map(assignment => assignment.task)
      })
    }

    const tasks = await prisma.tasks.findMany({
      where: whereClause,
      include: {
        category: true,
        projectAssignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                nameEs: true
              }
            }
          }
        },
        workerAssignments: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        progressUpdates: {
          include: {
            worker: {
              select: {
                id: true,
                name: true
              }
            },
            project: {
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

    // Verify category exists if provided
    if (validatedData.categoryId) {
      const category = await prisma.taskCategories.findFirst({
        where: {
          id: validatedData.categoryId,
          status: 'ACTIVE'
        }
      })

      if (!category) {
        return NextResponse.json({ error: 'Task category not found' }, { status: 404 })
      }
    }

    // Create task with materials in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the task (universal, no project)
      const task = await tx.tasks.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          categoryId: validatedData.categoryId,
          progressUnit: validatedData.progressUnit,
        }
      })

      // Note: Materials are no longer linked to tasks directly
      // They are assigned to projects and consumed by workers during progress updates

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

    // Verify the task exists (tasks are universal, not company-specific)
    const existingTask = await prisma.tasks.findFirst({
      where: {
        id: id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify category exists if provided
    if (validatedData.categoryId) {
      const category = await prisma.taskCategories.findFirst({
        where: {
          id: validatedData.categoryId,
          status: 'ACTIVE'
        }
      })

      if (!category) {
        return NextResponse.json({ error: 'Task category not found' }, { status: 404 })
      }
    }

    // Update task
    const updatedTask = await prisma.tasks.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        progressUnit: validatedData.progressUnit,
      }
    })

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
