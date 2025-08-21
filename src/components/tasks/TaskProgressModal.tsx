'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'


interface Task {
  id: string
  name: string
  description?: string
  category: {
    id: string
    name: string
  }
  progressUnit: string
  projectAssignments?: Array<{
    project: {
      id: string
      name: string
      nameEs?: string
    }
  }>
  workerAssignments?: Array<{
    project: {
      id: string
      name: string
      nameEs?: string
    }
  }>
}

interface MaterialConsumption {
  materialId: string
  quantity: number
}

interface MaterialLoss {
  materialId: string
  quantity: number
}

interface TaskProgressModalProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function TaskProgressModal({ task, open, onOpenChange, onSuccess }: TaskProgressModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    projectId: '',
    amountCompleted: '',
    status: 'IN_PROGRESS' as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OBSTACLE_PERMIT' | 'OBSTACLE_DECISION' | 'OBSTACLE_INSPECTION' | 'OBSTACLE_MATERIALS' | 'OBSTACLE_EQUIPMENT' | 'OBSTACLE_WEATHER' | 'OBSTACLE_OTHER',
    additionalAttributes: '',
    materialConsumptions: [] as MaterialConsumption[],
    materialLosses: [] as MaterialLoss[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: formData.projectId,
          amountCompleted: parseFloat(formData.amountCompleted),
          status: formData.status,
          additionalAttributes: formData.additionalAttributes || undefined,
          materialConsumptions: formData.materialConsumptions.length > 0 ? formData.materialConsumptions : undefined,
          materialLosses: formData.materialLosses.length > 0 ? formData.materialLosses : undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Progress logged successfully:', result)
        onSuccess()
        onOpenChange(false)
        // Reset form
        setFormData({
          projectId: '',
          amountCompleted: '',
          status: 'IN_PROGRESS',
          additionalAttributes: '',
          materialConsumptions: [],
          materialLosses: []
        })
      } else {
        const error = await response.json()
        console.error('Error logging progress:', error)
        alert(error.error || 'Failed to log progress')
      }
    } catch (error) {
      console.error('Error logging progress:', error)
      alert('Failed to log progress')
    } finally {
      setLoading(false)
    }
  }









  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Progreso: {task.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Tarea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Categoría</p>
                  <p className="text-sm">{task.category.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unidad de Medida</p>
                  <p className="text-sm">{task.progressUnit}</p>
                </div>
              </div>
              {task.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Descripción</p>
                  <p className="text-sm">{task.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proyecto *
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona un proyecto</option>
              {task.workerAssignments?.map((assignment) => (
                <option key={assignment.project.id} value={assignment.project.id}>
                  {assignment.project.nameEs || assignment.project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de la Tarea *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completada</option>
              <option value="OBSTACLE_PERMIT">Obstáculo - Permisos</option>
              <option value="OBSTACLE_DECISION">Obstáculo - Decisiones</option>
              <option value="OBSTACLE_INSPECTION">Obstáculo - Inspecciones</option>
              <option value="OBSTACLE_MATERIALS">Obstáculo - Materiales</option>
              <option value="OBSTACLE_EQUIPMENT">Obstáculo - Equipos</option>
              <option value="OBSTACLE_WEATHER">Obstáculo - Clima</option>
              <option value="OBSTACLE_OTHER">Obstáculo - Otro</option>
            </select>
          </div>

          {/* Progress Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad Completada ({task.progressUnit}) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amountCompleted}
              onChange={(e) => setFormData(prev => ({ ...prev, amountCompleted: e.target.value }))}
              placeholder={`Ingresa la cantidad completada en ${task.progressUnit}`}
              required
            />
          </div>

          {/* Additional Attributes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Atributos Adicionales (Opcional)
            </label>
            <Input
              type="text"
              value={formData.additionalAttributes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalAttributes: e.target.value }))}
              placeholder="ej., habitación A, pared norte, etc."
              maxLength={100}
            />
                          <p className="text-xs text-gray-500 mt-1">
                {formData.additionalAttributes.length}/100 caracteres
              </p>
          </div>

          {/* Note: Materials are tracked at project level, not task level */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Los materiales se asignan y rastrean a nivel de proyecto, no de tarea individual. 
              El consumo y pérdida de materiales se registra automáticamente desde el inventario del proyecto.
            </p>
          </div>



          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.projectId || !formData.amountCompleted || parseFloat(formData.amountCompleted) <= 0}
            >
              {loading ? 'Registrando...' : 'Registrar Progreso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
