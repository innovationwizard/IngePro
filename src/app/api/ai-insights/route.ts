import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import OpenAI from 'openai'

export const runtime = 'nodejs'

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// GET - Get AI-powered insights
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const insightType = searchParams.get('type') || 'all'
    const projectId = searchParams.get('projectId')
    
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

    // Build where clause for project filtering
    const projectFilter: any = {
      companyId: companyId
    }
    if (projectId) {
      projectFilter.id = projectId
    }

    // Get comprehensive data for AI analysis
    const data = await getAnalysisData(prisma, projectFilter)
    
    // Generate AI insights based on type
    let insights: any = {}
    
    if (insightType === 'all' || insightType === 'productivity') {
      insights.productivity = await generateProductivityInsights(data)
    }
    
    if (insightType === 'all' || insightType === 'materials') {
      insights.materials = await generateMaterialInsights(data)
    }
    
    if (insightType === 'all' || insightType === 'costs') {
      insights.costs = await generateCostInsights(data)
    }
    
    if (insightType === 'all' || insightType === 'predictions') {
      insights.predictions = await generatePredictiveInsights(data)
    }
    
    if (insightType === 'all' || insightType === 'recommendations') {
      insights.recommendations = await generateRecommendations(data)
    }

    return NextResponse.json({
      insights,
      dataSummary: {
        totalProjects: data.projects.length,
        totalTasks: data.tasks.length,
        totalWorkers: data.workers.length,
        totalMaterials: data.materials.length,
        dateRange: {
          start: data.dateRange.start,
          end: data.dateRange.end
        }
      }
    })

  } catch (error) {
    console.error('Error generating AI insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI insights' },
      { status: 500 }
    )
  }
}

// Helper function to get comprehensive data for analysis
async function getAnalysisData(prisma: any, projectFilter: any) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // Get projects
  const projects = await prisma.project.findMany({
    where: projectFilter,
    include: {
      taskAssignments: {
        include: {
          task: {
            include: {
              category: true
            }
          }
        }
      },
      workerAssignments: {
        include: {
          worker: true,
          task: true
        }
      },
      progressUpdates: {
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        include: {
          task: true,
          worker: true,
          materialConsumptions: true,
          materialLosses: true
        }
      },
      materials: {
        include: {
          material: true
        }
      }
    }
  })

  // Get all tasks
  const tasks = await prisma.task.findMany({
    include: {
      category: true,
      projectAssignments: {
        include: {
          project: true
        }
      },
      workerAssignments: {
        include: {
          worker: true,
          project: true
        }
      },
      progressUpdates: {
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        include: {
          project: true,
          worker: true
        }
      }
    }
  })

  // Get workers
  const workers = await prisma.user.findMany({
    where: {
      role: 'WORKER',
      userTenants: {
        some: {
          companyId: projectFilter.companyId,
          status: 'ACTIVE'
        }
      }
    }
  })

  // Get materials
  const materials = await prisma.material.findMany({
    include: {
      projectMaterials: {
        include: {
          project: true
        }
      },
      consumptions: {
        where: {
          recordedAt: { gte: thirtyDaysAgo }
        }
      },
      losses: {
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      },
      inventoryMovements: {
        where: {
          recordedAt: { gte: thirtyDaysAgo }
        }
      }
    }
  })

  // Get inventory movements
  const inventoryMovements = await prisma.inventoryMovement.findMany({
    where: {
      recordedAt: { gte: thirtyDaysAgo },
      material: {
        projectMaterials: {
          some: {
            project: projectFilter
          }
        }
      }
    },
    include: {
      material: true
    }
  })

  // Get reorder requests
  const reorderRequests = await prisma.reorderRequest.findMany({
    where: {
      material: {
        projectMaterials: {
          some: {
            project: projectFilter
          }
        }
      }
    },
    include: {
      material: true
    }
  })

  return {
    projects,
    tasks,
    workers,
    materials,
    inventoryMovements,
    reorderRequests,
    dateRange: {
      start: thirtyDaysAgo,
      end: now
    }
  }
}

// Generate productivity insights
async function generateProductivityInsights(data: any) {
  try {
    if (!openai) {
      return {
        analysis: 'OpenAI API no configurada. Por favor, configure OPENAI_API_KEY en las variables de entorno.',
        metrics: {
          totalProgressUpdates: data.projects.reduce((sum: number, p: any) => sum + p.progressUpdates.length, 0),
          averageUpdatesPerProject: data.projects.length > 0 ? 
            data.projects.reduce((sum: number, p: any) => sum + p.progressUpdates.length, 0) / data.projects.length : 0,
          activeWorkers: data.workers.length,
          totalTasks: data.tasks.length
        }
      }
    }

    const prompt = `Analyze the following construction project data and provide insights about productivity:

Projects: ${data.projects.length}
Tasks: ${data.tasks.length}
Workers: ${data.workers.length}
Progress Updates: ${data.projects.reduce((sum: number, p: any) => sum + p.progressUpdates.length, 0)}

Key metrics to analyze:
1. Worker productivity patterns
2. Task completion efficiency
3. Project progress trends
4. Bottlenecks and optimization opportunities

Provide specific, actionable insights in Spanish. Focus on construction industry best practices.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    })

    return {
      analysis: completion.choices[0]?.message?.content || 'No se pudieron generar insights de productividad',
      metrics: {
        totalProgressUpdates: data.projects.reduce((sum: number, p: any) => sum + p.progressUpdates.length, 0),
        averageUpdatesPerProject: data.projects.length > 0 ? 
          data.projects.reduce((sum: number, p: any) => sum + p.progressUpdates.length, 0) / data.projects.length : 0,
        activeWorkers: data.workers.length,
        totalTasks: data.tasks.length
      }
    }
  } catch (error) {
    console.error('Error generating productivity insights:', error)
    return {
      analysis: 'Error al generar insights de productividad',
      metrics: {}
    }
  }
}

// Generate material insights
async function generateMaterialInsights(data: any) {
  try {
    if (!openai) {
      const totalConsumption = data.materials.reduce((sum: number, m: any) => 
        sum + m.consumptions.reduce((s: number, c: any) => s + c.quantity, 0), 0)
      const totalLoss = data.materials.reduce((sum: number, m: any) => 
        sum + m.losses.reduce((s: number, l: any) => s + l.quantity, 0), 0)
      const efficiency = totalConsumption > 0 ? ((totalConsumption - totalLoss) / totalConsumption) * 100 : 0

      return {
        analysis: 'OpenAI API no configurada. Por favor, configure OPENAI_API_KEY en las variables de entorno.',
        metrics: {
          totalMaterials: data.materials.length,
          totalConsumption,
          totalLoss,
          efficiencyRate: efficiency,
          lowStockMaterials: data.materials.filter((m: any) => 
            m.currentStock <= (m.minStockLevel || 0)).length
        }
      }
    }

    const totalConsumption = data.materials.reduce((sum: number, m: any) => 
      sum + m.consumptions.reduce((s: number, c: any) => s + c.quantity, 0), 0)
    const totalLoss = data.materials.reduce((sum: number, m: any) => 
      sum + m.losses.reduce((s: number, l: any) => s + l.quantity, 0), 0)
    const efficiency = totalConsumption > 0 ? ((totalConsumption - totalLoss) / totalConsumption) * 100 : 0

    const prompt = `Analyze the following construction material data and provide insights:

Materials: ${data.materials.length}
Total Consumption: ${totalConsumption}
Total Loss: ${totalLoss}
Efficiency Rate: ${efficiency.toFixed(1)}%

Key areas to analyze:
1. Material efficiency and waste reduction
2. Inventory optimization opportunities
3. Cost-saving recommendations
4. Supply chain improvements

Provide specific, actionable insights in Spanish. Focus on construction industry best practices.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    })

    return {
      analysis: completion.choices[0]?.message?.content || 'No se pudieron generar insights de materiales',
      metrics: {
        totalMaterials: data.materials.length,
        totalConsumption,
        totalLoss,
        efficiencyRate: efficiency,
        lowStockMaterials: data.materials.filter((m: any) => 
          m.currentStock <= (m.minStockLevel || 0)).length
      }
    }
  } catch (error) {
    console.error('Error generating material insights:', error)
    return {
      analysis: 'Error al generar insights de materiales',
      metrics: {}
    }
  }
}

// Generate cost insights
async function generateCostInsights(data: any) {
  try {
    if (!openai) {
      const totalInventoryValue = data.materials.reduce((sum: number, m: any) => 
        sum + (m.currentStock * (m.unitCost || 0)), 0)
      const totalMovementCost = data.inventoryMovements.reduce((sum: number, m: any) => 
        sum + (m.totalCost || 0), 0)

      return {
        analysis: 'OpenAI API no configurada. Por favor, configure OPENAI_API_KEY en las variables de entorno.',
        metrics: {
          totalInventoryValue,
          totalMovementCost,
          averageProjectCost: data.projects.length > 0 ? totalInventoryValue / data.projects.length : 0,
          costPerMaterial: data.materials.length > 0 ? totalInventoryValue / data.materials.length : 0
        }
      }
    }

    const totalInventoryValue = data.materials.reduce((sum: number, m: any) => 
      sum + (m.currentStock * (m.unitCost || 0)), 0)
    const totalMovementCost = data.inventoryMovements.reduce((sum: number, m: any) => 
      sum + (m.totalCost || 0), 0)

    const prompt = `Analyze the following construction cost data and provide insights:

Total Inventory Value: $${totalInventoryValue.toLocaleString()}
Total Movement Costs: $${totalMovementCost.toLocaleString()}
Projects: ${data.projects.length}
Materials: ${data.materials.length}

Key areas to analyze:
1. Cost optimization opportunities
2. Budget management recommendations
3. ROI improvement strategies
4. Financial risk mitigation

Provide specific, actionable insights in Spanish. Focus on construction industry best practices.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    })

    return {
      analysis: completion.choices[0]?.message?.content || 'No se pudieron generar insights de costos',
      metrics: {
        totalInventoryValue,
        totalMovementCost,
        averageProjectCost: data.projects.length > 0 ? totalInventoryValue / data.projects.length : 0,
        costPerMaterial: data.materials.length > 0 ? totalInventoryValue / data.materials.length : 0
      }
    }
  } catch (error) {
    console.error('Error generating cost insights:', error)
    return {
      analysis: 'Error al generar insights de costos',
      metrics: {}
    }
  }
}

// Generate predictive insights
async function generatePredictiveInsights(data: any) {
  try {
    if (!openai) {
      return {
        analysis: 'OpenAI API no configurada. Por favor, configure OPENAI_API_KEY en las variables de entorno.',
        predictions: {
          estimatedCompletion: 'Configurar API para predicciones',
          resourceNeeds: 'Configurar API para predicciones',
          riskFactors: 'Configurar API para predicciones',
          performanceForecast: 'Configurar API para predicciones'
        }
      }
    }

    const prompt = `Based on the following construction project data, provide predictive insights:

Projects: ${data.projects.length}
Tasks: ${data.tasks.length}
Workers: ${data.workers.length}
Progress Updates: ${data.projects.reduce((sum: number, p: any) => sum + p.progressUpdates.length, 0)}
Materials: ${data.materials.length}

Predict the following:
1. Project completion timelines
2. Resource requirements
3. Potential bottlenecks
4. Risk factors and mitigation strategies
5. Performance trends for the next 30 days

Provide specific, actionable predictions in Spanish. Focus on construction industry patterns and data-driven forecasting.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600
    })

    return {
      analysis: completion.choices[0]?.message?.content || 'No se pudieron generar predicciones',
      predictions: {
        estimatedCompletion: 'Análisis en progreso',
        resourceNeeds: 'Evaluación en curso',
        riskFactors: 'Identificación en proceso',
        performanceForecast: 'Predicción en desarrollo'
      }
    }
  } catch (error) {
    console.error('Error generating predictive insights:', error)
    return {
      analysis: 'Error al generar predicciones',
      predictions: {}
    }
  }
}

// Generate recommendations
async function generateRecommendations(data: any) {
  try {
    if (!openai) {
      return {
        analysis: 'OpenAI API no configurada. Por favor, configure OPENAI_API_KEY en las variables de entorno.',
        priority: 'Configurar API',
        implementation: 'Configurar API',
        expectedImpact: 'Configurar API'
      }
    }

    const prompt = `Based on the following construction project data, provide actionable recommendations:

Projects: ${data.projects.length}
Tasks: ${data.tasks.length}
Workers: ${data.workers.length}
Materials: ${data.materials.length}
Progress Updates: ${data.projects.reduce((sum: number, p: any) => sum + p.progressUpdates.length, 0)}

Provide specific recommendations for:
1. Process improvements
2. Resource optimization
3. Cost reduction strategies
4. Quality enhancement
5. Timeline optimization
6. Risk management

Focus on practical, implementable recommendations in Spanish. Prioritize by impact and ease of implementation.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600
    })

    return {
      analysis: completion.choices[0]?.message?.content || 'No se pudieron generar recomendaciones',
      priority: 'Alta',
      implementation: 'Inmediata',
      expectedImpact: 'Significativo'
    }
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return {
      analysis: 'Error al generar recomendaciones',
      priority: 'N/A',
      implementation: 'N/A',
      expectedImpact: 'N/A'
    }
  }
}
