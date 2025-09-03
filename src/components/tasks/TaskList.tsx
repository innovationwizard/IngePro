'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Target } from 'lucide-react'
import { toast } from 'sonner'
import TaskAssignmentModal from './TaskAssignmentModal'
import TaskProjectAssignmentModal from './TaskProjectAssignmentModal'
import TaskProgressModal from './TaskProgressModal'
import TaskValidationModal from './TaskValidationModal'
import TaskEditForm from './TaskEditForm'
import TaskUnassignModal from './TaskUnassignModal'

interface Task {
  id: string
  name: string
  description?: string
  category?: {
    id: string
    name: string
  } | null
  progressUnit: string
  status: string
  projectAssignments?: Array<{
    project: {
      id: string
      name: string
      nameEs?: string
    }
  }>
  workerAssignments?: Array<{
    project: {
      id: string
      name: string
      nameEs?: string
    }
    worker: {
      id: string
      name: string
      role: string
    }
  }>
  progressUpdates?: Array<{
    id: string
    amountCompleted: number
    status: string
    additionalAttributes?: string
    validationStatus: string
    createdAt: string
    worker: {
      id: string
      name: string
    }
    project: {
      id: string
      name: string
      nameEs?: string
    }
    materialConsumptions: Array<{
      material: {
        name: string
        unit: string
      }
      quantity: number
    }>
    materialLosses: Array<{
      material: {
        name: string
        unit: string
      }
      quantity: number
      }
    >
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
}

interface TaskListProps {
  tasks: Task[]
  onTaskUpdated: () => void
  personRole: string
  currentUserId: string
}

const taskStatusColors = {
  'NOT_STARTED': 'bg-gray-100 text-gray-800',
  'IN_PROGRESS': 'bg-blue-100 text-blue-800',
  'COMPLETED': 'bg-green-100 text-green-800',
  'OBSTACLE_PERMIT': 'bg-yellow-100 text-yellow-800',
  'OBSTACLE_DECISION': 'bg-yellow-100 text-yellow-800',
  'OBSTACLE_INSPECTION': 'bg-yellow-100 text-yellow-800',
  'OBSTACLE_MATERIALS': 'bg-yellow-100 text-yellow-800',
  'OBSTACLE_EQUIPMENT': 'bg-yellow-100 text-yellow-800',
  'OBSTACLE_WEATHER': 'bg-yellow-100 text-yellow-800',
  'OBSTACLE_OTHER': 'bg-yellow-100 text-yellow-800',
}

const taskStatusLabels = {
  'NOT_STARTED': 'No Iniciado',
  'IN_PROGRESS': 'En Progreso',
  'COMPLETED': 'Completado',
  'OBSTACLE_PERMIT': 'Esperando Permiso',
  'OBSTACLE_DECISION': 'Esperando Decisión',
  'OBSTACLE_INSPECTION': 'Esperando Inspección',
  'OBSTACLE_MATERIALS': 'Esperando Materiales',
  'OBSTACLE_EQUIPMENT': 'Esperando Equipos',
  'OBSTACLE_WEATHER': 'Retraso por Clima',
  'OBSTACLE_OTHER': 'Otro Obstáculo',
}

export default function TaskList({ tasks, onTaskUpdated, personRole, currentUserId }: TaskListProps) {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showProjectAssignmentModal, setShowProjectAssignmentModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [showUnassignModal, setShowUnassignModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/task-categories')
        if (response.ok) {
                  const data = await response.json()
        console.log('Fetched categories data:', data)
        setCategories(data.taskCategories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    let filtered = tasks || []

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.projectAssignments || [])?.some(pa => pa.project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.workerAssignments || [])?.some(wa => wa.project.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchTerm, statusFilter])

  const handleAssignTask = (task: Task) => {
    setSelectedTask(task)
    setShowAssignmentModal(true)
  }

  const handleLogProgress = (task: Task) => {
    setSelectedTask(task)
    setShowProgressModal(true)
  }

  const handleValidateProgress = (task: Task) => {
    setSelectedTask(task)
    setShowValidationModal(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsEditModalOpen(true)
  }

  const handleUnassignTask = (task: Task) => {
    setSelectedTask(task)
    setShowUnassignModal(true)
  }

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task)
    setShowDeleteModal(true)
  }

  const confirmDeleteTask = async () => {
    if (!deletingTask) return

    try {
      const response = await fetch(`/api/tasks?id=${deletingTask.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Tarea eliminada exitosamente')
        setShowDeleteModal(false)
        setDeletingTask(null)
        onTaskUpdated()
      } else {
        const errorData = await response.json()
        if (errorData.error.includes('Cannot delete task - it has active usage')) {
          toast.error('No se puede eliminar la tarea - tiene uso activo. Desasigna primero todas las asignaciones.')
        } else {
          toast.error(errorData.error || 'Error al eliminar la tarea')
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Error al eliminar la tarea')
    }
  }

  const getTotalProgress = (task: Task) => {
    const validUpdates = (task.progressUpdates || []).filter(update => 
      update.validationStatus === 'VALIDATED'
    )
    return validUpdates.reduce((total, update) => total + update.amountCompleted, 0)
  }

  const getPendingUpdates = (task: Task) => {
    return (task.progressUpdates || []).filter(update => update.validationStatus === 'PENDING')
  }

  const getProgressPercentage = (task: Task) => {
    // For now, we'll use a simple calculation. In the future, this could be based on task.targetAmount
    const totalProgress = getTotalProgress(task)
    // Assuming a default target of 100 units if not specified
    const targetAmount = 100
    return Math.min((totalProgress / targetAmount) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 50) return 'bg-blue-500'
    if (percentage >= 25) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Action Buttons */}
      {(personRole === 'ADMIN' || personRole === 'SUPERVISOR') && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowProjectAssignmentModal(true)}
            className="btn-mobile flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Asignar Tarea a Proyecto</span>
            <span className="sm:hidden">Asignar</span>
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar tareas, categorías o proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Estados</SelectItem>
            {Object.entries(taskStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="grid gap-4">
        {filteredTasks && filteredTasks.length > 0 ? filteredTasks.map((task) => {
          const totalProgress = getTotalProgress(task)
          const pendingUpdates = getPendingUpdates(task)
          
          // Check if the current worker is assigned to this specific task
          const isAssignedToCurrentWorker = task.workerAssignments && 
            task.workerAssignments.some(assignment => assignment.worker.id === currentUserId)
          
          const canLogProgress = personRole === 'WORKER' && isAssignedToCurrentWorker
          const canValidate = (personRole === 'ADMIN' || personRole === 'SUPERVISOR') && pendingUpdates.length > 0

          return (
            <Card key={task.id} className="mobile-card hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{task.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Progress Section - Enhanced for Mobile */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Progreso de la Tarea</h4>
                    <span className="text-xs text-gray-500">
                      {totalProgress.toFixed(2)} {task.progressUnit}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(getProgressPercentage(task))}`}
                      style={{ width: `${getProgressPercentage(task)}%` }}
                    ></div>
                  </div>
                  
                  {/* Progress Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Categoría:</span>
                      <p className="font-medium">{task.category?.name || 'Sin categoría'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Unidad:</span>
                      <p className="font-medium">{task.progressUnit}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Proyectos:</span>
                      <p className="font-medium">
                        {task.projectAssignments && task.projectAssignments.length > 0 
                          ? `${task.projectAssignments.length} proyecto(s)`
                          : 'Sin proyectos asignados'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <Badge 
                        className={
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'OBSTACLE_PERMIT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">Trabajadores Asignados</p>
                  <div className="flex flex-wrap gap-2">
                    {task.workerAssignments && task.workerAssignments.length > 0 ? (
                      task.workerAssignments.map((assignment) => (
                        <Badge key={assignment.worker.id} variant="outline">
                          {assignment.worker.name} ({assignment.project.nameEs || assignment.project.name})
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Sin trabajadores asignados</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(personRole === 'ADMIN' || personRole === 'SUPERVISOR') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                        className="flex-1 sm:flex-none"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignTask(task)}
                        className="flex-1 sm:flex-none"
                      >
                        Desasignar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignTask(task)}
                        className="flex-1 sm:flex-none"
                      >
                        {isAssignedToCurrentWorker ? 'Reasignar' : 'Asignar'}
                      </Button>
                    </>
                  )}
                  
                  {/* Delete button - Admin only */}
                  {personRole === 'ADMIN' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTask(task)}
                      className="flex-1 sm:flex-none"
                    >
                      Eliminar
                    </Button>
                  )}
                  
                  {/* Enhanced Progress Button Section */}
                  {canLogProgress && (
                    <div className="w-full">
                      <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-blue-700">Tarea Asignada - Puedes Registrar Progreso</span>
                        </div>
                        <p className="text-xs text-blue-600 mb-3">
                          Haz clic en el botón para registrar tu progreso, materiales utilizados y fotos del trabajo realizado.
                        </p>
                        <Button
                          size="lg"
                          onClick={() => handleLogProgress(task)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <span className="hidden sm:inline">📊 Registrar Progreso</span>
                          <span className="sm:hidden">📊 Progreso</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {!canLogProgress && personRole === 'WORKER' && (
                    <div className="w-full">
                      <div className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-600">Tarea No Asignada</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Esta tarea no está asignada a ti. Contacta a tu supervisor para que te asigne la tarea.
                        </p>
                      </div>
                    </div>
                  )}

                  {canValidate && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleValidateProgress(task)}
                      className="flex-1 sm:flex-none"
                    >
                      Validar ({pendingUpdates.length})
                    </Button>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">
                        <span className="hidden sm:inline">Ver Detalles</span>
                        <span className="sm:hidden">Detalles</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-lg">{task.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Actualizaciones de Progreso</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {(task.progressUpdates || []).length > 0 ? (
                              (task.progressUpdates || []).map((update) => (
                                <div key={update.id} className="border rounded p-3">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium">{update.worker.name}</p>
                                      <p className="text-sm text-gray-600">
                                        {update.project.nameEs || update.project.name} • {new Date(update.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                    <Badge 
                                      className={
                                        update.validationStatus === 'VALIDATED' 
                                          ? 'bg-green-100 text-green-800'
                                          : update.validationStatus === 'REJECTED'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }
                                    >
                                      {update.validationStatus}
                                    </Badge>
                                  </div>
                                  <p className="text-sm">
                                    Completado: {update.amountCompleted} {task.progressUnit}
                                    {update.additionalAttributes && (
                                      <span className="text-gray-600 ml-2">
                                        ({update.additionalAttributes})
                                      </span>
                                    )}
                                  </p>
                                  {((update.materialConsumptions || []).length > 0 || (update.materialLosses || []).length > 0) && (
                                    <div className="mt-2 text-sm">
                                      {(update.materialConsumptions || []).length > 0 && (
                                        <div>
                                          <span className="font-medium">Consumido:</span>
                                          {(update.materialConsumptions || []).map((consumption, index) => (
                                            <span key={index} className="ml-1">
                                              {consumption.quantity} {consumption.material.unit} {consumption.material.name}
                                              {index < (update.materialConsumptions || []).length - 1 ? ', ' : ''}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {(update.materialLosses || []).length > 0 && (
                                        <div>
                                          <span className="font-medium">Perdido:</span>
                                          {(update.materialLosses || []).map((loss, index) => (
                                            <span key={index} className="ml-1">
                                              {loss.quantity} {loss.material.unit} {loss.material.name}
                                              {index < (update.materialLosses || []).length - 1 ? ', ' : ''}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">Aún no hay actualizaciones de progreso</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )
        }) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay tareas disponibles</p>
          </div>
        )}
      </div>

      {filteredTasks.length === 0 && (
               <div className="text-center py-8">
         <p className="text-gray-500">No se encontraron tareas</p>
       </div>
      )}

      {/* Modals */}
      {selectedTask && (
        <>
          <TaskAssignmentModal
            task={selectedTask}
            open={showAssignmentModal}
            onOpenChange={setShowAssignmentModal}
            onSuccess={() => {
              setShowAssignmentModal(false)
              onTaskUpdated()
            }}
          />

          <TaskProgressModal
            task={selectedTask}
            open={showProgressModal}
            onOpenChange={setShowProgressModal}
            onSuccess={() => {
              setShowProgressModal(false)
              onTaskUpdated()
            }}
          />

          <TaskValidationModal
            task={selectedTask}
            open={showValidationModal}
            onOpenChange={setShowValidationModal}
            onSuccess={() => {
              setShowValidationModal(false)
              onTaskUpdated()
            }}
          />

          <TaskUnassignModal
            task={selectedTask}
            open={showUnassignModal}
            onOpenChange={setShowUnassignModal}
            onSuccess={() => {
              setShowUnassignModal(false)
              setSelectedTask(null) // Clear selected task to force refresh
              onTaskUpdated()
            }}
          />
        </>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskEditForm
          task={editingTask}
          categories={categories}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingTask(null)
          }}
          onTaskUpdated={() => {
            setIsEditModalOpen(false)
            setEditingTask(null)
            onTaskUpdated()
          }}
        />
      )}

      {/* Task Project Assignment Modal */}
      <TaskProjectAssignmentModal
        open={showProjectAssignmentModal}
        onOpenChange={setShowProjectAssignmentModal}
        onSuccess={() => {
          setShowProjectAssignmentModal(false)
          onTaskUpdated()
        }}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Estás seguro de que quieres eliminar la tarea <strong>"{deletingTask?.name}"</strong>?
            </p>
            <p className="text-sm text-red-600">
              ⚠️ Esta acción no se puede deshacer. La tarea se eliminará permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingTask(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteTask}
              >
                Eliminar Tarea
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
