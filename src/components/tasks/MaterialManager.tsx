'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Material {
  id: string
  name: string
  nameEs?: string
  description?: string
  unit: string
}

interface MaterialManagerProps {
  materials: Material[]
  onMaterialCreated: () => void
}

export default function MaterialManager({ materials, onMaterialCreated }: MaterialManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    nameEs: '',
    description: '',
    unit: ''
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Material created successfully:', result)
        onMaterialCreated()
        setShowCreateModal(false)
        setFormData({ name: '', nameEs: '', description: '', unit: '' })
      } else {
        const error = await response.json()
        console.error('Error creating material:', error)
        alert(error.error || 'Failed to create material')
      }
    } catch (error) {
      console.error('Error creating material:', error)
      alert('Failed to create material')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMaterial) return

    setLoading(true)

    try {
      const response = await fetch('/api/materials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingMaterial.id,
          ...formData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Material updated successfully:', result)
        onMaterialCreated()
        setShowEditModal(false)
        setEditingMaterial(null)
        setFormData({ name: '', nameEs: '', description: '', unit: '' })
      } else {
        const error = await response.json()
        console.error('Error updating material:', error)
        alert(error.error || 'Failed to update material')
      }
    } catch (error) {
      console.error('Error updating material:', error)
      alert('Failed to update material')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      nameEs: material.nameEs || '',
      description: material.description || '',
      unit: material.unit
    })
    setShowEditModal(true)
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('Material deleted successfully')
        onMaterialCreated()
      } else {
        const error = await response.json()
        console.error('Error deleting material:', error)
        alert(error.error || 'Failed to delete material')
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      alert('Failed to delete material')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
                 <h3 className="text-lg font-medium">Materiales</h3>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
                             <Plus className="w-4 h-4 mr-2" />
               Agregar Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Material *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ingresa el nombre del material"
                  required
                />
              </div>
              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre corto
                  </label>
                <Input
                  type="text"
                  value={formData.nameEs}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameEs: e.target.value }))}
                                      placeholder="Ingresa el nombre corto (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad *
                </label>
                <Input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="ej., centímetros cúbicos, unidades, litros"
                  required
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
                  disabled={loading || !formData.name || !formData.unit}
                >
                  {loading ? 'Creando...' : 'Crear Material'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Materials List */}
      <div className="grid gap-4">
        {materials.map((material) => (
          <Card key={material.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{material.name}</h4>
                    <Badge variant="outline">
                      {material.unit}
                    </Badge>
                  </div>
                  {material.nameEs && (
                    <p className="text-sm text-gray-600 mb-1">
                      {material.nameEs}
                    </p>
                  )}
                  {material.description && (
                    <p className="text-sm text-gray-500">
                      {material.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(material)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(material.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron materiales</p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
                         <DialogTitle>Editar Material</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter material name"
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
                Unit *
              </label>
              <Input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., cubic centimeters, units, liters"
                required
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
                disabled={loading || !formData.name || !formData.unit}
              >
                                  {loading ? 'Actualizando...' : 'Actualizar Material'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
