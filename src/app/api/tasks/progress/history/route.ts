import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Get progress history with role-based filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const taskId = searchParams.get('taskId')
    const workerId = searchParams.get('workerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const validationStatus = searchParams.get('validationStatus')
    
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
      project: {
        companyId: companyId
      }
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (taskId) {
      whereClause.taskId = taskId
    }

    if (workerId) {
      whereClause.workerId = workerId
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = new Date(startDate)
      if (endDate) whereClause.createdAt.lte = new Date(endDate)
    }

    if (status) {
      whereClause.status = status
    }

    if (validationStatus) {
      whereClause.validationStatus = validationStatus
    }

    // Get progress updates with different includes based on role
    const isAdmin = session.user?.role === 'ADMIN'
    
    const progressUpdates = await prisma.taskProgressUpdate.findMany({
      where: whereClause,
      include: {
        task: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                nameEs: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            nameEs: true
          }
        },
        worker: {
          select: isAdmin ? {
            id: true,
            name: true,
            email: true
          } : {
            id: true,
            name: true
          }
        },
        materialConsumptions: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                nameEs: true,
                unit: true
              }
            }
          }
        },
        materialLosses: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                nameEs: true,
                unit: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Process data based on role
    let processedUpdates
    if (isAdmin) {
      // Admin gets complete information
      processedUpdates = progressUpdates.map(update => ({
        id: update.id,
        task: {
          id: update.task.id,
          name: update.task.name,
          category: update.task.category
        },
        project: update.project,
        worker: update.worker,
        amountCompleted: update.amountCompleted,
        status: update.status,
        additionalAttributes: update.additionalAttributes,
        validationStatus: update.validationStatus,
        validationComments: update.validationComments,
        validatedBy: update.validatedBy,
        validatedAt: update.validatedAt,
        createdAt: update.createdAt,
        materialConsumptions: update.materialConsumptions,
        materialLosses: update.materialLosses,
        totalConsumption: update.materialConsumptions.reduce((sum, mc) => sum + mc.quantity, 0),
        totalLoss: update.materialLosses.reduce((sum, ml) => sum + ml.quantity, 0)
      }))
    } else {
      // Supervisor gets anonymized information for invoicing
      processedUpdates = progressUpdates.map(update => ({
        id: update.id,
        task: {
          id: update.task.id,
          name: update.task.name,
          category: update.task.category
        },
        project: update.project,
        worker: {
          id: `Worker-${update.worker.id.slice(-4)}`, // Anonymized worker ID
          name: 'Worker' // Generic name for invoicing
        },
        amountCompleted: update.amountCompleted,
        status: update.status,
        additionalAttributes: update.additionalAttributes,
        validationStatus: update.validationStatus,
        validationComments: update.validationComments,
        validatedBy: update.validatedBy,
        validatedAt: update.validatedAt,
        createdAt: update.createdAt,
        materialConsumptions: update.materialConsumptions.map(mc => ({
          ...mc,
          material: mc.material
        })),
        materialLosses: update.materialLosses.map(ml => ({
          ...ml,
          material: ml.material
        })),
        totalConsumption: update.materialConsumptions.reduce((sum, mc) => sum + mc.quantity, 0),
        totalLoss: update.materialLosses.reduce((sum, ml) => sum + ml.quantity, 0)
      }))
    }

    // Calculate summary statistics
    const totalUpdates = processedUpdates.length
    const totalAmountCompleted = processedUpdates.reduce((sum, update) => sum + update.amountCompleted, 0)
    const totalConsumption = processedUpdates.reduce((sum, update) => sum + update.totalConsumption, 0)
    const totalLoss = processedUpdates.reduce((sum, update) => sum + update.totalLoss, 0)
    const pendingValidation = processedUpdates.filter(update => update.validationStatus === 'PENDING').length
    const validatedUpdates = processedUpdates.filter(update => update.validationStatus === 'VALIDATED').length
    const rejectedUpdates = processedUpdates.filter(update => update.validationStatus === 'REJECTED').length

    // Group by project for summary
    const projectSummary = processedUpdates.reduce((acc, update) => {
      const projectId = update.project.id
      if (!acc[projectId]) {
        acc[projectId] = {
          project: update.project,
          totalUpdates: 0,
          totalAmount: 0,
          totalConsumption: 0,
          totalLoss: 0,
          pendingValidation: 0,
          validatedUpdates: 0,
          rejectedUpdates: 0
        }
      }
      
      acc[projectId].totalUpdates++
      acc[projectId].totalAmount += update.amountCompleted
      acc[projectId].totalConsumption += update.totalConsumption
      acc[projectId].totalLoss += update.totalLoss
      
      if (update.validationStatus === 'PENDING') acc[projectId].pendingValidation++
      else if (update.validationStatus === 'VALIDATED') acc[projectId].validatedUpdates++
      else if (update.validationStatus === 'REJECTED') acc[projectId].rejectedUpdates++
      
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      progressUpdates: processedUpdates,
      summary: {
        totalUpdates,
        totalAmountCompleted,
        totalConsumption,
        totalLoss,
        pendingValidation,
        validatedUpdates,
        rejectedUpdates
      },
      projectSummary: Object.values(projectSummary),
      role: session.user?.role,
      isAnonymized: !isAdmin
    })

  } catch (error) {
    console.error('Error fetching progress history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress history' },
      { status: 500 }
    )
  }
}
