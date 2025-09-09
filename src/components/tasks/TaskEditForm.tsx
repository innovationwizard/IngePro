'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface TaskCategory {
  id: string
  name: string
  nameEs?: string
  description?: string
}

interface Task {
  id: string
  name: string
  description?: string
  categoryId?: string | null
  progressUnit: string
  category?: {
    id: string
    name: string
  } | null
}

interface TaskEditFormProps {
  task: Task
  categories: TaskCategory[]
  isOpen: boolean
  onClose: () => void
  onTaskUpdated: () => void
}

export default function TaskEditForm({ task, categories, isOpen, onClose, onTaskUpdated }: TaskEditFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    progressUnit: ''
  })


  // Initialize form with task data when task changes
  useEffect(() => {
    if (task) {
      const initialData = {
        name: task.name || '',
        description: task.description || '',
        categoryId: task.categoryId || 'none',
        progressUnit: task.progressUnit || ''
      }
      console.log('Initializing form with:', initialData)
      setFormData(initialData)
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare form data - remove categoryId if 'none' or empty string
      const submitData = {
        id: task.id,
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId === 'none' ? undefined : formData.categoryId,
        progressUnit: formData.progressUnit
      }

      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Task updated successfully:', result)
        onTaskUpdated()
        onClose()
      } else {
        const error = await response.json()
        console.error('Error updating task:', error)
        alert(error.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form to original task data
    if (task) {
      setFormData({
        name: task.name || '',
        description: task.description || '',
        categoryId: task.categoryId || 'none',
        progressUnit: task.progressUnit || ''
      })
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Tarea *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ingresa el nombre de la tarea"
                required
              />
            </div>

            {/* Progress Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de Progreso *
              </label>
              <Input
                type="text"
                value={formData.progressUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, progressUnit: e.target.value }))}
                placeholder="ej., metros lineales, metros cuadrados, unidades"
                required
              />
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría (Opcional)
              </label>
              <Select
                value={formData.categoryId || 'none'}
                onValueChange={(value) => {
                  console.log('Category changed to:', value)
                  setFormData(prev => {
                    const newData = { ...prev, categoryId: value }
                    console.log('Form data updated:', newData)
                    return newData
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem 
                    value="none" 
                    className="py-2 px-3 hover:bg-gray-50"
                  >
                    Sin categoría
                  </SelectItem>
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="py-2 px-3 hover:bg-gray-50"
                      >
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem 
                      value="no-categories" 
                      disabled
                      className="py-2 px-3"
                    >
                      No hay categorías disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ingresa la descripción de la tarea"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Note about materials */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Los materiales se asignan a los proyectos, no a las tareas individuales. 
              Las tareas son conceptos universales que pueden ser reutilizados en diferentes proyectos.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.progressUnit}
              className="min-w-[120px]"
            >
              {loading ? 'Actualizando...' : 'Actualizar Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
