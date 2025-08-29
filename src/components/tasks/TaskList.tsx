'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Target } from 'lucide-react'
import TaskAssignmentModal from './TaskAssignmentModal'
import TaskProjectAssignmentModal from './TaskProjectAssignmentModal'
import TaskProgressModal from './TaskProgressModal'
import TaskValidationModal from './TaskValidationModal'
import TaskEditForm from './TaskEditForm'

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
  progressUpdates: Array<{
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

export default function TaskList({ tasks, onTaskUpdated, personRole }: TaskListProps) {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showProjectAssignmentModal, setShowProjectAssignmentModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/task-categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    let filtered = tasks

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.projectAssignments?.some(pa => pa.project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        task.workerAssignments?.some(wa => wa.project.name.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const getTotalProgress = (task: Task) => {
    const validUpdates = task.progressUpdates.filter(update => 
      update.validationStatus === 'VALIDATED'
    )
    return validUpdates.reduce((total, update) => total + update.amountCompleted, 0)
  }

  const getPendingUpdates = (task: Task) => {
    return task.progressUpdates.filter(update => update.validationStatus === 'PENDING')
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      {(personRole === 'ADMIN' || personRole === 'SUPERVISOR') && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowProjectAssignmentModal(true)}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Asignar Tarea a Proyecto
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar tareas, categorías o proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
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
        {filteredTasks.map((task) => {
          const totalProgress = getTotalProgress(task)
          const pendingUpdates = getPendingUpdates(task)
          const isAssigned = task.workerAssignments && task.workerAssignments.length > 0
          const canLogProgress = personRole === 'WORKER' && isAssigned
          const canValidate = (personRole === 'ADMIN' || personRole === 'SUPERVISOR') && pendingUpdates.length > 0

          return (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{task.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  </div>

                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Categoría</p>
                    <p className="text-sm">{task.category?.name || 'Sin categoría'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Proyectos</p>
                    <p className="text-sm">
                      {task.projectAssignments && task.projectAssignments.length > 0 
                        ? `${task.projectAssignments.length} proyecto(s)`
                        : 'Sin proyectos asignados'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Unidad de Medida</p>
                    <p className="text-sm">{task.progressUnit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Progreso Total</p>
                    <p className="text-sm font-semibold">{totalProgress.toFixed(2)} {task.progressUnit}</p>
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

                <div className="flex gap-2">
                  {(personRole === 'ADMIN' || personRole === 'SUPERVISOR') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignTask(task)}
                      >
                        {isAssigned ? 'Reasignar' : 'Asignar'}
                      </Button>
                    </>
                  )}
                  
                  {canLogProgress && (
                                         <Button
                       size="sm"
                       onClick={() => handleLogProgress(task)}
                     >
                       Registrar Progreso
                     </Button>
                  )}

                  {canValidate && (
                                         <Button
                       variant="secondary"
                       size="sm"
                       onClick={() => handleValidateProgress(task)}
                     >
                       Validar ({pendingUpdates.length})
                     </Button>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                                         <Button variant="ghost" size="sm">
                     Ver Detalles
                   </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>{task.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                                                 <div>
                           <h4 className="font-medium mb-2">Actualizaciones de Progreso</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {task.progressUpdates.length > 0 ? (
                              task.progressUpdates.map((update) => (
                                <div key={update.id} className="border rounded p-3">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
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
                                  {(update.materialConsumptions.length > 0 || update.materialLosses.length > 0) && (
                                    <div className="mt-2 text-sm">
                                      {update.materialConsumptions.length > 0 && (
                                                                                 <div>
                                           <span className="font-medium">Consumido:</span>
                                          {update.materialConsumptions.map((consumption, index) => (
                                            <span key={index} className="ml-1">
                                              {consumption.quantity} {consumption.material.unit} {consumption.material.name}
                                              {index < update.materialConsumptions.length - 1 ? ', ' : ''}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {update.materialLosses.length > 0 && (
                                                                                 <div>
                                           <span className="font-medium">Perdido:</span>
                                          {update.materialLosses.map((loss, index) => (
                                            <span key={index} className="ml-1">
                                              {loss.quantity} {loss.material.unit} {loss.material.name}
                                              {index < update.materialLosses.length - 1 ? ', ' : ''}
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
        })}
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
    </div>
  )
}
