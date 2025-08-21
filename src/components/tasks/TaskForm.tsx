'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TaskCategory {
  id: string
  name: string
  nameEs?: string
  description?: string
}





interface TaskFormProps {
  categories: TaskCategory[]
  onTaskCreated: () => void
}

export default function TaskForm({ categories, onTaskCreated }: TaskFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    progressUnit: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Task created successfully:', result)
        onTaskCreated()
        // Reset form
        setFormData({
          name: '',
          description: '',
          categoryId: '',
          progressUnit: ''
        })
      } else {
        const error = await response.json()
        console.error('Error creating task:', error)
        alert(error.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task')
    } finally {
      setLoading(false)
    }
  }



  return (
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
        <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
           Categoría *
         </label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
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

      {/* Note: Materials are assigned to projects, not to individual tasks */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Nota:</strong> Los materiales se asignan a los proyectos, no a las tareas individuales. 
          Las tareas son conceptos universales que pueden ser reutilizados en diferentes proyectos.
        </p>
      </div>


      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || !formData.name || !formData.categoryId || !formData.progressUnit}
          className="min-w-[120px]"
        >
                     {loading ? 'Creando...' : 'Crear Tarea'}
        </Button>
      </div>
    </form>
  )
}
