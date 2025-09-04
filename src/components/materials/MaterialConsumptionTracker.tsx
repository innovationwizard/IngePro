'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, TrendingUp, TrendingDown, Calendar, Package } from 'lucide-react'

interface Project {
  id: string
  name: string
  nameEs?: string
}

interface Material {
  id: string
  name: string
  nameEs?: string
  unit: string
}

interface MaterialConsumption {
  id: string
  quantity: number
  type: string
  notes?: string
  recordedAt: string
  recordedBy?: string
  material: Material
  project: Project
}

interface MaterialLoss {
  id: string
  quantity: number
  createdAt: string
  material: Material
  project: Project
}

interface MaterialConsumptionTrackerProps {
  projects: Project[]
  materials: Material[]
  onConsumptionRecorded: () => void
}

export default function MaterialConsumptionTracker({ 
  projects, 
  materials, 
  onConsumptionRecorded 
}: MaterialConsumptionTrackerProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [consumptionData, setConsumptionData] = useState({
    projectId: '',
    materialId: '',
    quantity: '',
    type: 'CONSUMPTION' as 'CONSUMPTION' | 'LOSS',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [consumptionRecords, setConsumptionRecords] = useState<MaterialConsumption[]>([])
  const [lossRecords, setLossRecords] = useState<MaterialLoss[]>([])
  const [filterProject, setFilterProject] = useState('all')
  const [filterMaterial, setFilterMaterial] = useState('all')
  const [filterType, setFilterType] = useState('BOTH')

  useEffect(() => {
    fetchConsumptionData()
  }, [filterProject, filterMaterial, filterType])

  const fetchConsumptionData = async () => {
    try {
      const params = new URLSearchParams()
      if (filterProject !== 'all') params.append('projectId', filterProject)
      if (filterMaterial !== 'all') params.append('materialId', filterMaterial)
      if (filterType !== 'BOTH') params.append('type', filterType)

      const response = await fetch(`/api/materials/consumption?${params}`)
      if (response.ok) {
        const data = await response.json()
        setConsumptionRecords(data.consumptionRecords)
        setLossRecords(data.lossRecords)
      }
    } catch (error) {
      console.error('Error fetching consumption data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/materials/consumption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...consumptionData,
          quantity: parseFloat(consumptionData.quantity)
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Material consumption recorded successfully:', result)
        onConsumptionRecorded()
        setShowAddModal(false)
        // Reset form
        setConsumptionData({
          projectId: '',
          materialId: '',
          quantity: '',
          type: 'CONSUMPTION',
          notes: '',
          date: new Date().toISOString().split('T')[0]
        })
        // Refresh data
        fetchConsumptionData()
      } else {
        const error = await response.json()
        console.error('Error recording consumption:', error)
        alert(error.error || 'Failed to record consumption')
      }
    } catch (error) {
      console.error('Error recording consumption:', error)
      alert('Failed to record consumption')
    } finally {
      setLoading(false)
    }
  }

  const getTotalConsumption = () => {
    return consumptionRecords.reduce((sum, record) => sum + record.quantity, 0)
  }

  const getTotalLoss = () => {
    return lossRecords.reduce((sum, record) => sum + record.quantity, 0)
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.nameEs || project?.name || 'Unknown Project'
  }

  const getMaterialName = (materialId: string) => {
    const material = materials.find(m => m.id === materialId)
    return material?.nameEs || material?.name || 'Unknown Material'
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Seguimiento de Consumo de Materiales</h3>
          <p className="text-sm text-gray-600">
            Rastrea el consumo y pérdida de materiales por proyecto
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Registrar Consumo
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consumo Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getTotalConsumption().toFixed(2)}
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
                <p className="text-sm font-medium text-gray-600">Pérdida Total</p>
                <p className="text-2xl font-bold text-red-600">
                  {getTotalLoss().toFixed(2)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total General</p>
                <p className="text-2xl font-bold text-gray-800">
                  {(getTotalConsumption() + getTotalLoss()).toFixed(2)}
                </p>
              </div>
              <Package className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyecto
              </label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proyectos" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all" className="py-2 px-3 hover:bg-gray-50">Todos los proyectos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="py-2 px-3 hover:bg-gray-50">
                      {project.nameEs || project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <Select value={filterMaterial} onValueChange={setFilterMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los materiales" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all" className="py-2 px-3 hover:bg-gray-50">Todos los materiales</SelectItem>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id} className="py-2 px-3 hover:bg-gray-50">
                      {material.nameEs || material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Ambos tipos" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="BOTH" className="py-2 px-3 hover:bg-gray-50">Ambos tipos</SelectItem>
                  <SelectItem value="CONSUMPTION" className="py-2 px-3 hover:bg-gray-50">Consumo</SelectItem>
                  <SelectItem value="LOSS" className="py-2 px-3 hover:bg-gray-50">Pérdida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consumption Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros de Consumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consumptionRecords.length > 0 ? (
              consumptionRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-blue-600">
                        {record.type === 'CONSUMPTION' ? 'Consumo' : 'Pérdida'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(record.recordedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium">
                      {record.material.nameEs || record.material.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {record.project.nameEs || record.project.name}
                    </p>
                    {record.notes && (
                      <p className="text-sm text-gray-500 mt-1">{record.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-600">
                      {record.quantity} {record.material.unit}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hay registros de consumo para mostrar
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Consumption Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Consumo de Material</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyecto *
              </label>
              <Select
                value={consumptionData.projectId}
                onValueChange={(value) => setConsumptionData(prev => ({ ...prev, projectId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent className="max-h-60 w-full bg-white border border-gray-200 shadow-lg">
                  {projects.map((project) => (
                    <SelectItem 
                      key={project.id} 
                      value={project.id} 
                      className="py-3 px-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <span className="font-medium text-sm text-gray-900 leading-tight">
                        {project.nameEs || project.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Material Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material *
              </label>
              <Select
                value={consumptionData.materialId}
                onValueChange={(value) => setConsumptionData(prev => ({ ...prev, materialId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un material" />
                </SelectTrigger>
                <SelectContent className="max-h-60 w-full bg-white border border-gray-200 shadow-lg modal-dropdown">
                  {materials.map((material) => (
                    <SelectItem 
                      key={material.id} 
                      value={material.id} 
                      className="py-3 px-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900 leading-tight">
                          {material.nameEs || material.name}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 leading-tight">
                          Unidad: {material.unit}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <Select
                value={consumptionData.type}
                onValueChange={(value: any) => setConsumptionData(prev => ({ ...prev, type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full bg-white border border-gray-200 shadow-lg">
                  <SelectItem 
                    value="CONSUMPTION" 
                    className="py-3 px-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <span className="font-medium text-sm text-gray-900">Consumo</span>
                  </SelectItem>
                  <SelectItem 
                    value="LOSS" 
                    className="py-3 px-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <span className="font-medium text-sm text-gray-900">Pérdida</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={consumptionData.quantity}
                onChange={(e) => setConsumptionData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Ingresa la cantidad"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <Input
                type="date"
                value={consumptionData.date}
                onChange={(e) => setConsumptionData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <Input
                type="text"
                value={consumptionData.notes}
                onChange={(e) => setConsumptionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales (opcional)"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !consumptionData.projectId || !consumptionData.materialId || !consumptionData.quantity}
              >
                {loading ? 'Registrando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
