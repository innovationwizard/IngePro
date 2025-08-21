'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface TaskCategory {
  id: string
  name: string
  nameEs?: string
  description?: string
}

interface Material {
  id: string
  name: string
  nameEs?: string
  description?: string
  unit: string
}

interface Project {
  id: string
  name: string
  nameEs?: string
}

interface TaskFormProps {
  categories: TaskCategory[]
  materials: Material[]
  onTaskCreated: () => void
}

export default function TaskForm({ categories, materials, onTaskCreated }: TaskFormProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    projectId: '',
    progressUnit: '',
    materialIds: [] as string[]
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

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
          projectId: '',
          progressUnit: '',
          materialIds: []
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

  const handleMaterialToggle = (materialId: string) => {
    setFormData(prev => ({
      ...prev,
      materialIds: prev.materialIds.includes(materialId)
        ? prev.materialIds.filter(id => id !== materialId)
        : [...prev.materialIds, materialId]
    }))
  }

  const selectedMaterials = materials.filter(material => 
    formData.materialIds.includes(material.id)
  )

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

        {/* Project */}
        <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
           Proyecto *
         </label>
          <Select
            value={formData.projectId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
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

      {/* Materials */}
      <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
           Materiales Requeridos
         </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {materials.map((material) => (
            <div
              key={material.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.materialIds.includes(material.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleMaterialToggle(material.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{material.name}</p>
                  <p className="text-xs text-gray-500">{material.unit}</p>
                </div>
                {formData.materialIds.includes(material.id) && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Materials Summary */}
      {selectedMaterials.length > 0 && (
        <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
           Materiales Seleccionados ({selectedMaterials.length})
         </label>
          <div className="flex flex-wrap gap-2">
            {selectedMaterials.map((material) => (
              <Badge key={material.id} variant="outline" className="flex items-center gap-1">
                {material.name} ({material.unit})
                <button
                  type="button"
                  onClick={() => handleMaterialToggle(material.id)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || !formData.name || !formData.categoryId || !formData.projectId || !formData.progressUnit}
          className="min-w-[120px]"
        >
                     {loading ? 'Creando...' : 'Crear Tarea'}
        </Button>
      </div>
    </form>
  )
}
