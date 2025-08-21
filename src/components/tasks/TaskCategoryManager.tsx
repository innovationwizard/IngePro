'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface TaskCategory {
  id: string
  name: string
  nameEs?: string
  description?: string
  _count: {
    tasks: number
  }
}

interface TaskCategoryManagerProps {
  categories: TaskCategory[]
  onCategoryCreated: () => void
}

export default function TaskCategoryManager({ categories, onCategoryCreated }: TaskCategoryManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    nameEs: '',
    description: ''
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/task-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Category created successfully:', result)
        onCategoryCreated()
        setShowCreateModal(false)
        setFormData({ name: '', nameEs: '', description: '' })
      } else {
        const error = await response.json()
        console.error('Error creating category:', error)
        alert(error.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    setLoading(true)

    try {
      const response = await fetch('/api/task-categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCategory.id,
          ...formData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Category updated successfully:', result)
        onCategoryCreated()
        setShowEditModal(false)
        setEditingCategory(null)
        setFormData({ name: '', nameEs: '', description: '' })
      } else {
        const error = await response.json()
        console.error('Error updating category:', error)
        alert(error.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Failed to update category')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (category: TaskCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      nameEs: category.nameEs || '',
      description: category.description || ''
    })
    setShowEditModal(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/task-categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('Category deleted successfully')
        onCategoryCreated()
      } else {
        const error = await response.json()
        console.error('Error deleting category:', error)
        alert(error.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
                 <h3 className="text-lg font-medium">Categorías de Tareas</h3>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
                             <Plus className="w-4 h-4 mr-2" />
               Agregar Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Categoría</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Categoría *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ingresa el nombre de la categoría"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre en Español
                </label>
                <Input
                  type="text"
                  value={formData.nameEs}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameEs: e.target.value }))}
                  placeholder="Ingresa el nombre en español (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ingresa la descripción (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name}
                >
                  {loading ? 'Creando...' : 'Crear Categoría'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{category.name}</h4>
                    <Badge variant="outline">
                      {category._count.tasks} tareas
                    </Badge>
                  </div>
                  {category.nameEs && (
                    <p className="text-sm text-gray-600 mb-1">
                      {category.nameEs}
                    </p>
                  )}
                  {category.description && (
                    <p className="text-sm text-gray-500">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={category._count.tasks > 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron categorías</p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
                         <DialogTitle>Editar Categoría</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spanish Name
              </label>
              <Input
                type="text"
                value={formData.nameEs}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEs: e.target.value }))}
                placeholder="Enter Spanish name (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name}
              >
                                  {loading ? 'Actualizando...' : 'Actualizar Categoría'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
