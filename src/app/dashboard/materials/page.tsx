'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Package, Edit, Trash2 } from 'lucide-react'
import MaterialConsumptionTracker from '@/components/materials/MaterialConsumptionTracker'
import InventoryManager from '@/components/inventory/InventoryManager'
import ProgressHistory from '@/components/tasks/ProgressHistory'
import MaterialAssignmentModal from '@/components/materials/MaterialAssignmentModal'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

// Vercel logging function
const logToVercel = (action: string, details: any = {}) => {
  console.log(`[VERCEL_LOG] ${action}:`, details)
  // In production, this will show up in Vercel logs
}

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

interface Task {
  id: string
  name: string
  description?: string
  category?: {
    id: string
    name: string
  } | null
  project: {
    id: string
    name: string
  }
  progressUnit: string
  status: string
  assignedPeople: Array<{
    person: {
      id: string
      name: string
      role: string
    }
  }>
  _count: {
    progressUpdates: number
  }
}

export default function MaterialsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('consumption')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchProjects()
    fetchMaterials()
    fetchTasks()
  }, [session, status, router])

  const fetchProjects = async () => {
    logToVercel('MATERIALS_PROJECTS_FETCH_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
        
        logToVercel('MATERIALS_PROJECTS_FETCH_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          projectsCount: data.projects?.length || 0,
          timestamp: new Date().toISOString()
        })
      } else {
        logToVercel('MATERIALS_PROJECTS_FETCH_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          status: response.status,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      logToVercel('MATERIALS_PROJECTS_FETCH_ERROR', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('Error fetching projects:', error)
    }
  }

  const fetchMaterials = async () => {
    logToVercel('MATERIALS_FETCH_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch('/api/materials')
      if (response.ok) {
        const data = await response.json()
        setMaterials(data.materials)
        
        logToVercel('MATERIALS_FETCH_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          materialsCount: data.materials?.length || 0,
          timestamp: new Date().toISOString()
        })
      } else {
        logToVercel('MATERIALS_FETCH_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          status: response.status,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      logToVercel('MATERIALS_FETCH_ERROR', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('Error fetching materials:', error)
    }
  }

  const fetchTasks = async () => {
    logToVercel('MATERIALS_TASKS_FETCH_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
        
        logToVercel('MATERIALS_TASKS_FETCH_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          tasksCount: data.tasks?.length || 0,
          timestamp: new Date().toISOString()
        })
      } else {
        logToVercel('MATERIALS_TASKS_FETCH_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          status: response.status,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      logToVercel('MATERIALS_TASKS_FETCH_ERROR', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaterial = async (materialData: any) => {
    logToVercel('MATERIALS_CREATE_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      materialName: materialData.name,
      materialUnit: materialData.unit,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(materialData)
      })

      const data = await response.json()

      if (response.ok) {
        logToVercel('MATERIALS_CREATE_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          materialName: materialData.name,
          materialUnit: materialData.unit,
          timestamp: new Date().toISOString()
        })
        
        setMessage('Material creado exitosamente')
        setIsCreateModalOpen(false)
        // Refresh materials list
        fetchMaterials()
      } else {
        logToVercel('MATERIALS_CREATE_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          materialName: materialData.name,
          materialUnit: materialData.unit,
          error: data.error,
          status: response.status,
          timestamp: new Date().toISOString()
        })
        setMessage(`Error: ${data.error || 'Error al crear material'}`)
      }
    } catch (error) {
      logToVercel('MATERIALS_CREATE_ERROR', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        materialName: materialData.name,
        materialUnit: materialData.unit,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('Error creating material:', error)
      setMessage('Error de conexión')
    }
  }

  const handleTabChange = (value: string) => {
    logToVercel('MATERIALS_TAB_CHANGED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      fromTab: activeTab,
      toTab: value,
      timestamp: new Date().toISOString()
    })
    
    setActiveTab(value)
  }

  const handleCreateMaterialModalOpen = () => {
    logToVercel('MATERIALS_CREATE_MODAL_OPENED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    setIsCreateModalOpen(true)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isAdmin = session.user?.role === 'ADMIN'
  const isSupervisor = session.user?.role === 'SUPERVISOR'

  // Only allow admin and supervisor access
  if (!isAdmin && !isSupervisor) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Materiales</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Gestiona inventario, consumo de materiales y seguimiento de progreso
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setIsAssignmentModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Asignar a Proyecto
            </button>
            <button
              onClick={handleCreateMaterialModalOpen}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Material
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex w-full gap-1 sm:gap-2 p-1 sm:p-2 tabs-list-mobile overflow-x-auto min-h-[3rem] bg-gray-100 rounded-lg shadow-sm">
          <TabsTrigger value="consumption" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Consumo</TabsTrigger>
          <TabsTrigger value="inventory" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Inventario</TabsTrigger>
          <TabsTrigger value="assignments" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Asignaciones</TabsTrigger>
          <TabsTrigger value="manage" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Gestionar</TabsTrigger>
          <TabsTrigger value="history" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento de Consumo de Materiales</CardTitle>
            </CardHeader>
            <CardContent>
              <MaterialConsumptionTracker 
                projects={projects}
                materials={materials}
                onConsumptionRecorded={() => {
                  // Refresh data if needed
                  console.log('Material consumption recorded')
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryManager 
                materials={materials}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asignación de Materiales a Proyectos</CardTitle>
              <p className="text-sm text-gray-600">
                Asigna materiales disponibles a proyectos específicos para control de inventario y seguimiento de consumo
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Gestionar Asignaciones</h3>
                <p className="text-gray-600 mb-4">
                  Usa el botón "Asignar a Proyecto" en la parte superior para asignar materiales a proyectos
                </p>
                <Button
                  onClick={() => setIsAssignmentModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Abrir Asignador de Materiales
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Materiales</CardTitle>
              <p className="text-sm text-gray-600">
                {isAdmin ? 'Administra todos los materiales: crear, editar y eliminar' : 'Solo administradores pueden gestionar materiales'}
              </p>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <MaterialsManager 
                  materials={materials}
                  onMaterialUpdated={fetchMaterials}
                />
              ) : (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
                  <p className="text-gray-600">
                    Solo los administradores pueden gestionar materiales
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Progreso</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressHistory 
                projects={projects}
                tasks={tasks}
                userRole={session.user?.role || ''}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Material Modal */}
      {isCreateModalOpen && (
        <CreateMaterialModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateMaterial}
        />
      )}

      {/* Material Assignment Modal */}
      <MaterialAssignmentModal
        open={isAssignmentModalOpen}
        onOpenChange={setIsAssignmentModalOpen}
        onSuccess={() => {
          // Refresh data if needed
          console.log('Materials assigned successfully')
        }}
        projects={projects}
        materials={materials}
      />
    </div>
  )
}

// Material Creation Modal Component
function CreateMaterialModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    nameEs: '',
    description: '',
    unit: '',
    unitCost: '',
    minStockLevel: '',
    maxStockLevel: '',
    currentStock: '0'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
        minStockLevel: formData.minStockLevel ? parseFloat(formData.minStockLevel) : undefined,
        maxStockLevel: formData.maxStockLevel ? parseFloat(formData.maxStockLevel) : undefined,
        currentStock: parseFloat(formData.currentStock)
      }
      
      await onSubmit(submitData)
      setFormData({
        name: '',
        nameEs: '',
        description: '',
        unit: '',
        unitCost: '',
        minStockLevel: '',
        maxStockLevel: '',
        currentStock: '0'
      })
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Material</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre en Español</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.nameEs}
                onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unidad *</label>
              <input
                type="text"
                required
                placeholder="ej: kg, litros, unidades"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Costo por Unidad</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Máximo</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.maxStockLevel}
                onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Inicial</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creando...' : 'Crear Material'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Materials Manager Component for Admin CRUD operations
function MaterialsManager({ materials, onMaterialUpdated }: {
  materials: Material[]
  onMaterialUpdated: () => void
}) {
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material)
    setShowEditModal(true)
  }

  const handleDeleteMaterial = (material: Material) => {
    setDeletingMaterial(material)
    setShowDeleteModal(true)
  }

  const handleEditSubmit = async (formData: any) => {
    if (!editingMaterial) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: editingMaterial.id,
          ...formData
        })
      })

      const data = await response.json()

      if (response.ok) {
        setShowEditModal(false)
        setEditingMaterial(null)
        onMaterialUpdated()
      } else {
        alert(`Error: ${data.error || 'Error al actualizar material'}`)
      }
    } catch (error) {
      console.error('Error updating material:', error)
      alert('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingMaterial) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/materials?id=${deletingMaterial.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setShowDeleteModal(false)
        setDeletingMaterial(null)
        onMaterialUpdated()
      } else {
        alert(`Error: ${data.error || 'Error al eliminar material'}`)
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      alert('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {materials.map((material) => (
          <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-medium">{material.nameEs || material.name}</h4>
                <span className="text-sm text-gray-500">({material.name})</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Unidad: {material.unit} • Stock: {material.currentStock}
                {material.unitCost && ` • Costo: $${material.unitCost}/${material.unit}`}
              </p>
              {material.description && (
                <p className="text-sm text-gray-500 mt-1">{material.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditMaterial(material)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteMaterial(material)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
        {materials.length === 0 && (
          <p className="text-center text-gray-500 py-8">No hay materiales registrados</p>
        )}
      </div>

      {/* Edit Material Modal */}
      {showEditModal && editingMaterial && (
        <EditMaterialModal
          material={editingMaterial}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingMaterial(null)
          }}
          onSubmit={handleEditSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingMaterial && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que quieres eliminar el material <strong>"{deletingMaterial.nameEs || deletingMaterial.name}"</strong>?
              </p>
              <p className="text-sm text-red-600 mb-4">
                ⚠️ Esta acción no se puede deshacer. El material se eliminará permanentemente.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingMaterial(null)
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Material Modal Component
function EditMaterialModal({ material, isOpen, onClose, onSubmit, isSubmitting }: {
  material: Material
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState({
    name: material.name,
    nameEs: material.nameEs || '',
    description: material.description || '',
    unit: material.unit,
    unitCost: material.unitCost?.toString() || '',
    minStockLevel: material.minStockLevel?.toString() || '',
    maxStockLevel: material.maxStockLevel?.toString() || '',
    currentStock: material.currentStock.toString()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
      minStockLevel: formData.minStockLevel ? parseFloat(formData.minStockLevel) : undefined,
      maxStockLevel: formData.maxStockLevel ? parseFloat(formData.maxStockLevel) : undefined,
      currentStock: parseFloat(formData.currentStock)
    }
    
    await onSubmit(submitData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Material</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre en Español</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.nameEs}
                onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unidad *</label>
              <input
                type="text"
                required
                placeholder="ej: kg, litros, unidades"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Costo por Unidad</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Máximo</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.maxStockLevel}
                onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Actual</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Material'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
