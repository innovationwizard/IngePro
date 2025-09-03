import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Get comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const workerId = searchParams.get('workerId')
    
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

    // Build where clause for date filtering
    const dateFilter: any = {}
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
    }

    // Build where clause for project filtering
    const projectFilter: any = {
      companyId: companyId
    }
    if (projectId) {
      projectFilter.id = projectId
    }

    // Build where clause for worker filtering
    const workerFilter: any = {}
    if (workerId) {
      workerFilter.id = workerId
    }

    // 1. Productivity Analytics
    const productivityData = await getProductivityAnalytics(prisma, dateFilter, projectFilter, workerFilter)
    
    // 2. Material Efficiency Analytics
    const materialEfficiencyData = await getMaterialEfficiencyAnalytics(prisma, dateFilter, projectFilter)
    
    // 3. Cost Analysis
    const costAnalysisData = await getCostAnalysis(prisma, dateFilter, projectFilter)
    
    // 4. Performance Metrics
    const performanceMetrics = await getPerformanceMetrics(prisma, dateFilter, projectFilter, workerFilter)
    
    // 5. Time-based Trends
    const timeTrends = await getTimeTrends(prisma, dateFilter, projectFilter)
    
    // 6. Worker Performance Ranking
    const workerRanking = await getWorkerPerformanceRanking(prisma, dateFilter, projectFilter)

    return NextResponse.json({
      productivity: productivityData,
      materialEfficiency: materialEfficiencyData,
      costAnalysis: costAnalysisData,
      performance: performanceMetrics,
      timeTrends: timeTrends,
      workerRanking: workerRanking,
      filters: {
        projectId,
        startDate,
        endDate,
        workerId
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Helper function for productivity analytics
async function getProductivityAnalytics(prisma: any, dateFilter: any, projectFilter: any, workerFilter: any) {
  // Get progress updates with filters
  const progressUpdates = await prisma.taskProgressUpdates.findMany({
    where: {
      createdAt: dateFilter,
      project: projectFilter,
      worker: workerFilter
    },
    include: {
      task: {
        include: {
          category: true
        }
      },
      project: true,
      worker: true
    }
  })

  // Calculate productivity metrics
  const totalUpdates = progressUpdates.length
  const totalAmountCompleted = progressUpdates.reduce((sum, update) => sum + update.amountCompleted, 0)
  const averageAmountPerUpdate = totalUpdates > 0 ? totalAmountCompleted / totalUpdates : 0
  
  // Productivity by task category
  const productivityByCategory = progressUpdates.reduce((acc, update) => {
    const categoryName = update.task.category.nameEs || update.task.category.name
    if (!acc[categoryName]) {
      acc[categoryName] = {
        totalAmount: 0,
        updateCount: 0,
        averageAmount: 0
      }
    }
    acc[categoryName].totalAmount += update.amountCompleted
    acc[categoryName].updateCount += 1
    return acc
  }, {} as Record<string, any>)

  // Calculate averages
  Object.keys(productivityByCategory).forEach(category => {
    productivityByCategory[category].averageAmount = 
      productivityByCategory[category].totalAmount / productivityByCategory[category].updateCount
  })

  // Productivity by project
  const productivityByProject = progressUpdates.reduce((acc, update) => {
    const projectName = update.project.nameEs || update.project.name
    if (!acc[projectName]) {
      acc[projectName] = {
        totalAmount: 0,
        updateCount: 0,
        averageAmount: 0
      }
    }
    acc[projectName].totalAmount += update.amountCompleted
    acc[projectName].updateCount += 1
    return acc
  }, {} as Record<string, any>)

  // Calculate averages
  Object.keys(productivityByProject).forEach(project => {
    productivityByProject[project].averageAmount = 
      productivityByProject[project].totalAmount / productivityByProject[project].updateCount
  })

  return {
    totalUpdates,
    totalAmountCompleted,
    averageAmountPerUpdate,
    byCategory: productivityByCategory,
    byProject: productivityByProject
  }
}

// Helper function for material efficiency analytics
async function getMaterialEfficiencyAnalytics(prisma: any, dateFilter: any, projectFilter: any) {
  // Get material consumption and loss data
  const materialConsumptions = await prisma.materialConsumptions.findMany({
    where: {
      recordedAt: dateFilter,
      project: projectFilter
    },
    include: {
      material: true,
      project: true
    }
  })

  const materialLosses = await prisma.materialLosses.findMany({
    where: {
      createdAt: dateFilter,
      project: projectFilter
    },
    include: {
      material: true,
      project: true
    }
  })

  // Calculate material efficiency metrics
  const totalConsumption = materialConsumptions.reduce((sum, mc) => sum + mc.quantity, 0)
  const totalLoss = materialLosses.reduce((sum, ml) => sum + ml.quantity, 0)
  const efficiencyRate = totalConsumption > 0 ? ((totalConsumption - totalLoss) / totalConsumption) * 100 : 0

  // Material efficiency by project
  const efficiencyByProject = materialConsumptions.reduce((acc, mc) => {
    const projectName = mc.project.nameEs || mc.project.name
    if (!acc[projectName]) {
      acc[projectName] = {
        consumption: 0,
        loss: 0,
        efficiency: 0
      }
    }
    acc[projectName].consumption += mc.quantity
    return acc
  }, {} as Record<string, any>)

  // Add loss data
  materialLosses.forEach(ml => {
    const projectName = ml.project.nameEs || ml.project.name
    if (efficiencyByProject[projectName]) {
      efficiencyByProject[projectName].loss += ml.quantity
    }
  })

  // Calculate efficiency rates
  Object.keys(efficiencyByProject).forEach(project => {
    const { consumption, loss } = efficiencyByProject[project]
    efficiencyByProject[project].efficiency = consumption > 0 ? ((consumption - loss) / consumption) * 100 : 0
  })

  // Material efficiency by material type
  const efficiencyByMaterial = materialConsumptions.reduce((acc, mc) => {
    const materialName = mc.material.nameEs || mc.material.name
    if (!acc[materialName]) {
      acc[materialName] = {
        consumption: 0,
        loss: 0,
        efficiency: 0,
        unit: mc.material.unit
      }
    }
    acc[materialName].consumption += mc.quantity
    return acc
  }, {} as Record<string, any>)

  // Add loss data
  materialLosses.forEach(ml => {
    const materialName = ml.material.nameEs || ml.material.name
    if (efficiencyByMaterial[materialName]) {
      efficiencyByMaterial[materialName].loss += ml.quantity
    }
  })

  // Calculate efficiency rates
  Object.keys(efficiencyByMaterial).forEach(material => {
    const { consumption, loss } = efficiencyByMaterial[material]
    efficiencyByMaterial[material].efficiency = consumption > 0 ? ((consumption - loss) / consumption) * 100 : 0
  })

  return {
    totalConsumption,
    totalLoss,
    efficiencyRate,
    byProject: efficiencyByProject,
    byMaterial: efficiencyByMaterial
  }
}

// Helper function for cost analysis
async function getCostAnalysis(prisma: any, dateFilter: any, projectFilter: any) {
  // This would typically integrate with actual cost data
  // For now, we'll provide a framework for cost analysis
  
  const progressUpdates = await prisma.taskProgressUpdates.findMany({
    where: {
      createdAt: dateFilter,
      project: projectFilter
    },
    include: {
      project: true
    }
  })

  // Calculate estimated costs based on progress
  const costByProject = progressUpdates.reduce((acc, update) => {
    const projectName = update.project.nameEs || update.project.name
    if (!acc[projectName]) {
      acc[projectName] = {
        totalProgress: 0,
        estimatedCost: 0,
        costPerUnit: 0
      }
    }
    acc[projectName].totalProgress += update.amountCompleted
    return acc
  }, {} as Record<string, any>)

  // Apply estimated cost per unit (this would come from actual cost data)
  Object.keys(costByProject).forEach(project => {
    // Example: $100 per unit of progress
    costByProject[project].costPerUnit = 100
    costByProject[project].estimatedCost = costByProject[project].totalProgress * costByProject[project].costPerUnit
  })

  const totalEstimatedCost = Object.values(costByProject).reduce((sum: number, project: any) => sum + project.estimatedCost, 0)

  return {
    totalEstimatedCost,
    byProject: costByProject,
    note: 'Costs are estimated based on progress units. Actual costs may vary.'
  }
}

// Helper function for performance metrics
async function getPerformanceMetrics(prisma: any, dateFilter: any, projectFilter: any, workerFilter: any) {
  const progressUpdates = await prisma.taskProgressUpdates.findMany({
    where: {
      createdAt: dateFilter,
      project: projectFilter,
      worker: workerFilter
    },
    include: {
      worker: true,
      project: true
    }
  })

  // Calculate performance metrics
  const totalWorkers = new Set(progressUpdates.map(update => update.worker.id)).size
  const totalProjects = new Set(progressUpdates.map(update => update.project.id)).size
  
  // Average updates per worker
  const updatesPerWorker = totalWorkers > 0 ? progressUpdates.length / totalWorkers : 0
  
  // Validation rate
  const validatedUpdates = progressUpdates.filter(update => update.validationStatus === 'VALIDATED').length
  const validationRate = progressUpdates.length > 0 ? (validatedUpdates / progressUpdates.length) * 100 : 0
  
  // Rejection rate
  const rejectedUpdates = progressUpdates.filter(update => update.validationStatus === 'REJECTED').length
  const rejectionRate = progressUpdates.length > 0 ? (rejectedUpdates / progressUpdates.length) * 100 : 0

  return {
    totalWorkers,
    totalProjects,
    updatesPerWorker,
    validationRate,
    rejectionRate,
    totalUpdates: progressUpdates.length
  }
}

// Helper function for time trends
async function getTimeTrends(prisma: any, dateFilter: any, projectFilter: any) {
  const progressUpdates = await prisma.taskProgressUpdates.findMany({
    where: {
      createdAt: dateFilter,
      project: projectFilter
    },
    select: {
      createdAt: true,
      amountCompleted: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  // Group by week for trend analysis
  const weeklyTrends = progressUpdates.reduce((acc, update) => {
    const weekStart = new Date(update.createdAt)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!acc[weekKey]) {
      acc[weekKey] = {
        week: weekKey,
        totalAmount: 0,
        updateCount: 0
      }
    }
    
    acc[weekKey].totalAmount += update.amountCompleted
    acc[weekKey].updateCount += 1
    
    return acc
  }, {} as Record<string, any>)

  // Convert to array and sort
  const trendsArray = Object.values(weeklyTrends).sort((a: any, b: any) => a.week.localeCompare(b.week))

  return {
    weekly: trendsArray,
    totalWeeks: trendsArray.length
  }
}

// Helper function for worker performance ranking
async function getWorkerPerformanceRanking(prisma: any, dateFilter: any, projectFilter: any) {
  const progressUpdates = await prisma.taskProgressUpdates.findMany({
    where: {
      createdAt: dateFilter,
      project: projectFilter
    },
    include: {
      worker: true
    }
  })

  // Calculate worker performance
  const workerPerformance = progressUpdates.reduce((acc, update) => {
    const workerId = update.worker.id
    const workerName = update.worker.name
    
    if (!acc[workerId]) {
      acc[workerId] = {
        id: workerId,
        name: workerName,
        totalAmount: 0,
        updateCount: 0,
        averageAmount: 0,
        validationRate: 0,
        totalValidated: 0
      }
    }
    
    acc[workerId].totalAmount += update.amountCompleted
    acc[workerId].updateCount += 1
    
    if (update.validationStatus === 'VALIDATED') {
      acc[workerId].totalValidated += 1
    }
    
    return acc
  }, {} as Record<string, any>)

  // Calculate averages and validation rates
  Object.values(workerPerformance).forEach((worker: any) => {
    worker.averageAmount = worker.updateCount > 0 ? worker.totalAmount / worker.updateCount : 0
    worker.validationRate = worker.updateCount > 0 ? (worker.totalValidated / worker.updateCount) * 100 : 0
  })

  // Convert to array and sort by total amount (performance ranking)
  const rankingArray = Object.values(workerPerformance).sort((a: any, b: any) => b.totalAmount - a.totalAmount)

  return {
    ranking: rankingArray,
    topPerformers: rankingArray.slice(0, 5), // Top 5 workers
    totalWorkers: rankingArray.length
  }
}
