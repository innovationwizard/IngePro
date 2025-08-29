'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import MaterialConsumptionTracker from '@/components/materials/MaterialConsumptionTracker'
import InventoryManager from '@/components/inventory/InventoryManager'
import ProgressHistory from '@/components/tasks/ProgressHistory'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials')
      if (response.ok) {
        const data = await response.json()
        setMaterials(data.materials)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaterial = async (materialData: any) => {
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(materialData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Material creado exitosamente')
        setIsCreateModalOpen(false)
        // Refresh materials list
        fetchMaterials()
      } else {
        setMessage(`Error: ${data.error || 'Error al crear material'}`)
      }
    } catch (error) {
      console.error('Error creating material:', error)
      setMessage('Error de conexión')
    }
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
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Material
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full gap-1 sm:gap-2 p-1 sm:p-2 tabs-list-mobile overflow-x-auto min-h-[3rem] bg-gray-100 rounded-lg shadow-sm">
          <TabsTrigger value="consumption" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Consumo</TabsTrigger>
          <TabsTrigger value="inventory" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Inventario</TabsTrigger>
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
