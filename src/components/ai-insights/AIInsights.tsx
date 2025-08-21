'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Target,
  Lightbulb,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
)

interface Project {
  id: string
  name: string
  nameEs?: string
}

interface AIInsightsProps {
  projects: Project[]
}

interface InsightData {
  productivity?: {
    analysis: string
    metrics: {
      totalProgressUpdates: number
      averageUpdatesPerProject: number
      activeWorkers: number
      totalTasks: number
    }
  }
  materials?: {
    analysis: string
    metrics: {
      totalMaterials: number
      totalConsumption: number
      totalLoss: number
      efficiencyRate: number
      lowStockMaterials: number
    }
  }
  costs?: {
    analysis: string
    metrics: {
      totalInventoryValue: number
      totalMovementCost: number
      averageProjectCost: number
      costPerMaterial: number
    }
  }
  predictions?: {
    analysis: string
    predictions: {
      estimatedCompletion: string
      resourceNeeds: string
      riskFactors: string
      performanceForecast: string
    }
  }
  recommendations?: {
    analysis: string
    priority: string
    implementation: string
    expectedImpact: string
  }
}

export default function AIInsights({ projects }: AIInsightsProps) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [dataSummary, setDataSummary] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedProject, setSelectedProject] = useState('all')
  const [insightType, setInsightType] = useState('all')
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

  useEffect(() => {
    if (insights) {
      setLastGenerated(new Date())
    }
  }, [insights])

  const generateInsights = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedProject !== 'all') params.append('projectId', selectedProject)
      if (insightType !== 'all') params.append('type', insightType)

      const response = await fetch(`/api/ai-insights?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights)
        setDataSummary(data.dataSummary)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baja': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImplementationColor = (implementation: string) => {
    switch (implementation.toLowerCase()) {
      case 'inmediata': return 'bg-red-100 text-red-800'
      case 'corta': return 'bg-yellow-100 text-yellow-800'
      case 'media': return 'bg-blue-100 text-blue-800'
      case 'larga': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'significativo': return 'bg-purple-100 text-purple-800'
      case 'moderado': return 'bg-blue-100 text-blue-800'
      case 'bajo': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Chart data for productivity trends
  const productivityChartData = {
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    datasets: [
      {
        label: 'Actualizaciones de Progreso',
        data: [12, 19, 15, 25],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1
      }
    ]
  }

  // Chart data for material efficiency
  const materialChartData = {
    labels: ['Eficiencia', 'Pérdidas'],
    datasets: [
      {
        data: [85, 15],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  }

  // Chart data for cost distribution
  const costChartData = {
    labels: ['Inventario', 'Movimientos', 'Operaciones'],
    datasets: [
      {
        label: 'Costos ($)',
        data: [45000, 12000, 8000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 1
      }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Insights de IA</h3>
          <p className="text-sm text-gray-600">
            Análisis inteligente y recomendaciones basadas en datos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.nameEs || project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={insightType} onValueChange={setInsightType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de insight" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los insights</SelectItem>
              <SelectItem value="productivity">Productividad</SelectItem>
              <SelectItem value="materials">Materiales</SelectItem>
              <SelectItem value="costs">Costos</SelectItem>
              <SelectItem value="predictions">Predicciones</SelectItem>
              <SelectItem value="recommendations">Recomendaciones</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={generateInsights} disabled={loading}>
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Generar Insights
          </Button>
        </div>
      </div>

      {/* Last Generated Info */}
      {lastGenerated && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Últimos insights generados: {lastGenerated.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Summary */}
      {dataSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Proyectos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dataSummary.totalProjects}
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tareas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dataSummary.totalTasks}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Trabajadores</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dataSummary.totalWorkers}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Materiales</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {dataSummary.totalMaterials}
                  </p>
                </div>
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Tabs */}
      {insights && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="productivity">Productividad</TabsTrigger>
            <TabsTrigger value="materials">Materiales</TabsTrigger>
            <TabsTrigger value="costs">Costos</TabsTrigger>
            <TabsTrigger value="predictions">Predicciones</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Productivity Overview */}
              {insights.productivity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Productividad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            {insights.productivity.metrics.totalProgressUpdates}
                          </p>
                          <p className="text-sm text-gray-600">Actualizaciones</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {insights.productivity.metrics.activeWorkers}
                          </p>
                          <p className="text-sm text-gray-600">Trabajadores</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {insights.productivity.analysis.substring(0, 200)}...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Materials Overview */}
              {insights.materials && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-green-600" />
                      Materiales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {insights.materials.metrics.efficiencyRate.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600">Eficiencia</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">
                            {insights.materials.metrics.lowStockMaterials}
                          </p>
                          <p className="text-sm text-gray-600">Stock Bajo</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {insights.materials.analysis.substring(0, 200)}...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Costs Overview */}
              {insights.costs && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      Costos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            ${insights.costs.metrics.totalInventoryValue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Valor Inventario</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-orange-600">
                            ${insights.costs.metrics.totalMovementCost.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Costos Movimiento</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {insights.costs.analysis.substring(0, 200)}...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Predictions Overview */}
              {insights.predictions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-600" />
                      Predicciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-red-600">
                            {insights.predictions.predictions.estimatedCompletion}
                          </p>
                          <p className="text-sm text-gray-600">Completación</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-600">
                            {insights.predictions.predictions.riskFactors}
                          </p>
                          <p className="text-sm text-gray-600">Riesgos</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {insights.predictions.analysis.substring(0, 200)}...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Productivity Tab */}
          <TabsContent value="productivity" className="space-y-6">
            {insights.productivity && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Métricas de Productividad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">
                            {insights.productivity.metrics.totalProgressUpdates}
                          </p>
                          <p className="text-sm text-gray-600">Total Actualizaciones</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-3xl font-bold text-green-600">
                            {insights.productivity.metrics.averageUpdatesPerProject.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600">Promedio por Proyecto</p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Análisis de IA:</h4>
                        <p className="text-sm text-gray-700">{insights.productivity.analysis}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tendencias de Productividad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Line 
                      data={productivityChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                          title: {
                            display: true,
                            text: 'Progreso Semanal'
                          }
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            {insights.materials && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Eficiencia de Materiales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-3xl font-bold text-green-600">
                            {insights.materials.metrics.efficiencyRate.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600">Tasa de Eficiencia</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-3xl font-bold text-red-600">
                            {insights.materials.metrics.lowStockMaterials}
                          </p>
                          <p className="text-sm text-gray-600">Materiales Stock Bajo</p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Análisis de IA:</h4>
                        <p className="text-sm text-gray-700">{insights.materials.analysis}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribución de Eficiencia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Doughnut 
                      data={materialChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'bottom' as const,
                          }
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-6">
            {insights.costs && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Análisis de Costos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            ${insights.costs.metrics.totalInventoryValue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Valor Total Inventario</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">
                            ${insights.costs.metrics.totalMovementCost.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Costos de Movimiento</p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Análisis de IA:</h4>
                        <p className="text-sm text-gray-700">{insights.costs.analysis}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribución de Costos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Bar 
                      data={costChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          }
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            {insights.predictions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Predicciones de IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">Completación Estimada</h4>
                          <p className="text-sm text-blue-700">{insights.predictions.predictions.estimatedCompletion}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Necesidades de Recursos</h4>
                          <p className="text-sm text-green-700">{insights.predictions.predictions.resourceNeeds}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <h4 className="font-medium text-red-800 mb-2">Factores de Riesgo</h4>
                          <p className="text-sm text-red-700">{insights.predictions.predictions.riskFactors}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-medium text-purple-800 mb-2">Pronóstico de Rendimiento</h4>
                          <p className="text-sm text-purple-700">{insights.predictions.predictions.performanceForecast}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Análisis Predictivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Análisis de IA:</h4>
                      <p className="text-sm text-gray-700">{insights.predictions.analysis}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            {insights.recommendations && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recomendaciones de IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-3">
                          <Badge className={getPriorityColor(insights.recommendations.priority)}>
                            {insights.recommendations.priority}
                          </Badge>
                          <span className="text-sm font-medium">Prioridad</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getImplementationColor(insights.recommendations.implementation)}>
                            {insights.recommendations.implementation}
                          </Badge>
                          <span className="text-sm font-medium">Implementación</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getImpactColor(insights.recommendations.expectedImpact)}>
                            {insights.recommendations.expectedImpact}
                          </Badge>
                          <span className="text-sm font-medium">Impacto Esperado</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Análisis de Recomendaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Análisis de IA:</h4>
                      <p className="text-sm text-gray-700">{insights.recommendations.analysis}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* No Insights State */}
      {!insights && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Genera Insights de IA
            </h3>
            <p className="text-gray-500 mb-4">
              Haz clic en "Generar Insights" para obtener análisis inteligente basado en tus datos
            </p>
            <Button onClick={generateInsights}>
              <Brain className="w-4 h-4 mr-2" />
              Comenzar Análisis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="text-center py-12">
          <CardContent>
            <RefreshCw className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Generando Insights de IA
            </h3>
            <p className="text-gray-500">
              Analizando datos y generando recomendaciones inteligentes...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
