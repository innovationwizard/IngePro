'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Target,
  Clock,
  DollarSign,
  Users,
  Package,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  Filter
} from 'lucide-react'

interface Project {
  id: string
  name: string
  nameEs?: string
}

interface Worker {
  id: string
  name: string
}

interface AnalyticsData {
  productivity: {
    totalUpdates: number
    totalAmountCompleted: number
    averageAmountPerUpdate: number
    byCategory: Record<string, any>
    byProject: Record<string, any>
  }
  materialEfficiency: {
    totalConsumption: number
    totalLoss: number
    efficiencyRate: number
    byProject: Record<string, any>
    byMaterial: Record<string, any>
  }
  costAnalysis: {
    totalEstimatedCost: number
    byProject: Record<string, any>
    note: string
  }
  performance: {
    totalWorkers: number
    totalProjects: number
    updatesPerWorker: number
    validationRate: number
    rejectionRate: number
    totalUpdates: number
  }
  timeTrends: {
    weekly: Array<{
      week: string
      totalAmount: number
      updateCount: number
    }>
    totalWeeks: number
  }
  workerRanking: {
    ranking: Array<{
      id: string
      name: string
      totalAmount: number
      updateCount: number
      averageAmount: number
      validationRate: number
    }>
    topPerformers: Array<any>
    totalWorkers: number
  }
}

interface AdvancedAnalyticsProps {
  projects: Project[]
  workers: Worker[]
}

export default function AdvancedAnalytics({ projects, workers }: AdvancedAnalyticsProps) {
  const [loading, setLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Filters
  const [filters, setFilters] = useState({
    projectId: 'all',
    workerId: 'all',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchAnalytics()
  }, [filters])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.projectId !== 'all') params.append('projectId', filters.projectId)
      if (filters.workerId !== 'all') params.append('workerId', filters.workerId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600'
    if (efficiency >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 90) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>
    if (efficiency >= 75) return <Badge className="bg-yellow-100 text-yellow-800">Bueno</Badge>
    return <Badge className="bg-red-100 text-red-800">Mejorable</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Cargando análisis...</div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay datos de análisis disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Análisis Avanzado</h3>
          <p className="text-sm text-gray-600">
            Métricas de productividad, eficiencia de materiales y análisis de costos
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyecto
              </label>
              <Select 
                value={filters.projectId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proyectos" />
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trabajador
              </label>
              <Select 
                value={filters.workerId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, workerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los trabajadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los trabajadores</SelectItem>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.name}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="productivity">Productividad</TabsTrigger>
          <TabsTrigger value="materials">Materiales</TabsTrigger>
          <TabsTrigger value="costs">Costos</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Progreso</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analyticsData.productivity.totalAmountCompleted.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Eficiencia Material</p>
                    <p className={`text-2xl font-bold ${getEfficiencyColor(analyticsData.materialEfficiency.efficiencyRate)}`}>
                      {analyticsData.materialEfficiency.efficiencyRate.toFixed(1)}%
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa Validación</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analyticsData.performance.validationRate.toFixed(1)}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Costo Estimado</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${analyticsData.costAnalysis.totalEstimatedCost.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Trabajadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.workerRanking.topPerformers.map((worker, index) => (
                    <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{worker.name}</p>
                          <p className="text-sm text-gray-600">
                            {worker.updateCount} actualizaciones
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          {worker.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {worker.validationRate.toFixed(1)}% validado
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eficiencia por Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.materialEfficiency.byProject).map(([projectName, data]: [string, any]) => (
                    <div key={projectName} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{projectName}</p>
                        <p className="text-sm text-gray-600">
                          Consumo: {data.consumption.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        {getEfficiencyBadge(data.efficiency)}
                        <p className="text-sm text-gray-600 mt-1">
                          {data.efficiency.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Productividad por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.productivity.byCategory).map(([category, data]: [string, any]) => (
                    <div key={category} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">{category}</p>
                        <Badge variant="outline">{data.updateCount}</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>Total: {data.totalAmount.toFixed(2)}</p>
                        <p>Promedio: {data.averageAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Productividad por Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.productivity.byProject).map(([project, data]: [string, any]) => (
                    <div key={project} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">{project}</p>
                        <Badge variant="outline">{data.updateCount}</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>Total: {data.totalAmount.toFixed(2)}</p>
                        <p>Promedio: {data.averageAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métricas Generales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {analyticsData.productivity.totalUpdates}
                    </p>
                    <p className="text-sm text-gray-600">Total Actualizaciones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {analyticsData.productivity.averageAmountPerUpdate.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Promedio por Actualización</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eficiencia de Materiales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className={`text-4xl font-bold ${getEfficiencyColor(analyticsData.materialEfficiency.efficiencyRate)}`}>
                      {analyticsData.materialEfficiency.efficiencyRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Tasa de Eficiencia</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {analyticsData.materialEfficiency.totalConsumption.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">Consumo Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {analyticsData.materialEfficiency.totalLoss.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">Pérdida Total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eficiencia por Material</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.materialEfficiency.byMaterial).map(([material, data]: [string, any]) => (
                    <div key={material} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">{material}</p>
                        <Badge variant="outline">{data.unit}</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>Consumo: {data.consumption.toFixed(2)}</p>
                        <p>Pérdida: {data.loss.toFixed(2)}</p>
                        <div className="flex items-center gap-2">
                          <span>Eficiencia:</span>
                          {getEfficiencyBadge(data.efficiency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análisis de Costos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">
                    ${analyticsData.costAnalysis.totalEstimatedCost.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Costo Total Estimado</p>
                  <p className="text-xs text-gray-500 mt-2">{analyticsData.costAnalysis.note}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analyticsData.costAnalysis.byProject).map(([project, data]: [string, any]) => (
                    <div key={project} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-3">{project}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Progreso Total:</span>
                          <span>{data.totalProgress.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Costo por Unidad:</span>
                          <span>${data.costPerUnit}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Costo Estimado:</span>
                          <span>${data.estimatedCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {analyticsData.performance.totalWorkers}
                      </p>
                      <p className="text-sm text-gray-600">Trabajadores</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {analyticsData.performance.totalProjects}
                      </p>
                      <p className="text-sm text-gray-600">Proyectos</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Tasa de Validación</span>
                      <span className="text-lg font-bold text-blue-600">
                        {analyticsData.performance.validationRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium">Tasa de Rechazo</span>
                      <span className="text-lg font-bold text-red-600">
                        {analyticsData.performance.rejectionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Promedio por Trabajador</span>
                      <span className="text-lg font-bold text-green-600">
                        {analyticsData.performance.updatesPerWorker.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ranking de Trabajadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.workerRanking.ranking.map((worker, index) => (
                    <div key={worker.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{worker.name}</p>
                            <p className="text-sm text-gray-600">
                              {worker.updateCount} actualizaciones
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">
                            {worker.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {worker.validationRate.toFixed(1)}% validado
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tendencias Semanales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analyticsData.timeTrends.weekly.map((week) => (
                    <div key={week.week} className="p-4 border rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        Semana del {new Date(week.week).toLocaleDateString()}
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {week.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {week.updateCount} actualizaciones
                      </p>
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-gray-500">
                  Total de semanas analizadas: {analyticsData.timeTrends.totalWeeks}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
