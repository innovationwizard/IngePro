'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import TaskList from '@/components/tasks/TaskList'
import TaskForm from '@/components/tasks/TaskForm'
import TaskCategoryManager from '@/components/tasks/TaskCategoryManager'
import MaterialManager from '@/components/tasks/MaterialManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Task {
  id: string
  name: string
  description?: string
  category: {
    id: string
    name: string
  }
  project: {
    id: string
    name: string
  }
  progressUnit: string
  status: string
  assignedUsers: Array<{
    user: {
      id: string
      name: string
      role: string
    }
  }>
  _count: {
    progressUpdates: number
  }
}

interface TaskCategory {
  id: string
  name: string
  nameEs?: string
  description?: string
  _count: {
    tasks: number
  }
}

interface Material {
  id: string
  name: string
  nameEs?: string
  description?: string
  unit: string
}

export default function TasksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchTasks()
    fetchCategories()
    fetchMaterials()
  }, [session, status, router])

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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/task-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.taskCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
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

  const handleTaskCreated = () => {
    fetchTasks()
    setActiveTab('tasks')
  }

  const handleCategoryCreated = () => {
    fetchCategories()
  }

  const handleMaterialCreated = () => {
    fetchMaterials()
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
  const isWorker = session.user?.role === 'WORKER'

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Tareas</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tareas, categorías y materiales para tus proyectos de construcción
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          {(isAdmin || isSupervisor) && (
            <TabsTrigger value="create">Crear Tarea</TabsTrigger>
          )}
          {isAdmin && (
            <>
              <TabsTrigger value="categories">Categorías</TabsTrigger>
              <TabsTrigger value="materials">Materiales</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tareas</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList 
                tasks={tasks} 
                onTaskUpdated={fetchTasks}
                userRole={session.user?.role || ''}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {(isAdmin || isSupervisor) && (
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Tarea</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskForm 
                  categories={categories}
                  materials={materials}
                  onTaskCreated={handleTaskCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <>
            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Categorías de Tareas</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskCategoryManager 
                    categories={categories}
                    onCategoryCreated={handleCategoryCreated}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Materiales</CardTitle>
                </CardHeader>
                <CardContent>
                  <MaterialManager 
                    materials={materials}
                    onMaterialCreated={handleMaterialCreated}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
