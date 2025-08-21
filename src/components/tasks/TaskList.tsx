'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import TaskAssignmentModal from './TaskAssignmentModal'
import TaskProgressModal from './TaskProgressModal'
import TaskValidationModal from './TaskValidationModal'

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
  progressUpdates: Array<{
    id: string
    amountCompleted: number
    additionalAttributes?: string
    validationStatus: string
    createdAt: string
    user: {
      id: string
      name: string
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
    }>
  }>
  _count: {
    progressUpdates: number
  }
}

interface TaskListProps {
  tasks: Task[]
  onTaskUpdated: () => void
  userRole: string
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

export default function TaskList({ tasks, onTaskUpdated, userRole }: TaskListProps) {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)

  useEffect(() => {
    let filtered = tasks

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.project.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          const isAssigned = task.assignedUsers.length > 0
          const canLogProgress = userRole === 'WORKER' && isAssigned
          const canValidate = (userRole === 'ADMIN' || userRole === 'SUPERVISOR') && pendingUpdates.length > 0

          return (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{task.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  </div>
                  <Badge className={taskStatusColors[task.status as keyof typeof taskStatusColors]}>
                    {taskStatusLabels[task.status as keyof typeof taskStatusLabels]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Categoría</p>
                    <p className="text-sm">{task.category.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Proyecto</p>
                    <p className="text-sm">{task.project.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Unidad de Progreso</p>
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
                    {task.assignedUsers.length > 0 ? (
                      task.assignedUsers.map((assignment) => (
                        <Badge key={assignment.user.id} variant="outline">
                          {assignment.user.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Sin trabajadores asignados</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {(userRole === 'ADMIN' || userRole === 'SUPERVISOR') && (
                                         <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleAssignTask(task)}
                     >
                       {isAssigned ? 'Reasignar' : 'Asignar'}
                     </Button>
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
                                      <p className="font-medium">{update.user.name}</p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(update.createdAt).toLocaleString()}
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
    </div>
  )
}
