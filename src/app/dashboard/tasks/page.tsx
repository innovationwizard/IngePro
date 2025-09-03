'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import TaskList from '@/components/tasks/TaskList'
import TaskForm from '@/components/tasks/TaskForm'
import TaskCategoryManager from '@/components/tasks/TaskCategoryManager'
import TaskProjectAssignmentModal from '@/components/tasks/TaskProjectAssignmentModal'


import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target } from 'lucide-react'

// Vercel logging function
const logToVercel = (action: string, details: any = {}) => {
  console.log(`[VERCEL_LOG] ${action}:`, details)
  // In production, this will show up in Vercel logs
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

interface TaskCategory {
  id: string
  name: string
  nameEs?: string
  description?: string
  _count: {
    tasks: number
  }
}

interface Project {
  id: string
  name: string
  nameEs?: string
}





export default function TasksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [showProjectAssignmentModal, setShowProjectAssignmentModal] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchTasks()
    fetchCategories()
    fetchProjects()
  }, [session, status, router])

  const fetchTasks = async () => {
    logToVercel('TASKS_FETCH_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
        
        logToVercel('TASKS_FETCH_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          tasksCount: data.tasks?.length || 0,
          timestamp: new Date().toISOString()
        })
      } else {
        logToVercel('TASKS_FETCH_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          status: response.status,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      logToVercel('TASKS_FETCH_ERROR', {
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

  const fetchCategories = async () => {
    logToVercel('TASKS_CATEGORIES_FETCH_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch('/api/task-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.taskCategories || [])
        
        logToVercel('TASKS_CATEGORIES_FETCH_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          categoriesCount: data.taskCategories?.length || 0,
          timestamp: new Date().toISOString()
        })
      } else {
        logToVercel('TASKS_CATEGORIES_FETCH_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          status: response.status,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      logToVercel('TASKS_CATEGORIES_FETCH_ERROR', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProjects = async () => {
    logToVercel('TASKS_PROJECTS_FETCH_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
        
        logToVercel('TASKS_PROJECTS_FETCH_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          projectsCount: data.projects?.length || 0,
          timestamp: new Date().toISOString()
        })
      } else {
        logToVercel('TASKS_PROJECTS_FETCH_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          status: response.status,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      logToVercel('TASKS_PROJECTS_FETCH_ERROR', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('Error fetching projects:', error)
    }
  }





  const handleTaskCreated = () => {
    logToVercel('TASKS_TASK_CREATED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    fetchTasks()
    setActiveTab('tasks')
  }

  const handleCategoryCreated = () => {
    logToVercel('TASKS_CATEGORY_CREATED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    fetchCategories()
  }

  const handleTabChange = (value: string) => {
    logToVercel('TASKS_TAB_CHANGED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      fromTab: activeTab,
      toTab: value,
      timestamp: new Date().toISOString()
    })
    
    setActiveTab(value)
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
  const personRole = session.user?.role || ''
  
  // Debug logging
  console.log('TasksPage render - session user role:', session.user?.role, 'personRole:', personRole, 'isAdmin:', isAdmin)

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Tareas</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Gestiona tareas, categorías y materiales para tus proyectos de construcción
        </p>
        {/* Debug info */}
        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
          Debug: User Role = {session.user?.role} | personRole = {personRole} | isAdmin = {isAdmin.toString()}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex w-full gap-1 sm:gap-2 p-1 sm:p-2 tabs-list-mobile overflow-x-auto min-h-[3rem] bg-gray-100 rounded-lg shadow-sm">
          <TabsTrigger value="tasks" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Tareas</TabsTrigger>
          {(isAdmin || isSupervisor) && (
            <TabsTrigger value="create" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Crear Tarea</TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="categories" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Categorías</TabsTrigger>
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
                personRole={personRole}
                currentUserId={session.user?.id || ''}
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


          </>
        )}
      </Tabs>

      {/* Task Project Assignment Modal */}
      <TaskProjectAssignmentModal
        open={showProjectAssignmentModal}
        onOpenChange={setShowProjectAssignmentModal}
        onSuccess={() => {
          setShowProjectAssignmentModal(false)
          fetchTasks()
        }}
      />
    </div>
  )
}
