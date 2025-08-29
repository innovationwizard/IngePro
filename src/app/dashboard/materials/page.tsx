'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Materiales</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Gestiona inventario, consumo de materiales y seguimiento de progreso
        </p>
      </div>

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
    </div>
  )
}
