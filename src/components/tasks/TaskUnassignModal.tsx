'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface TaskUnassignModalProps {
  task: {
    id: string
    name: string
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
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function TaskUnassignModal({ task, open, onOpenChange, onSuccess }: TaskUnassignModalProps) {
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleWorkerToggle = (workerId: string) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const handleUnassign = async () => {
    if (selectedWorkers.length === 0) {
      toast.error('Por favor selecciona al menos un trabajador para desasignar')
      return
    }

    setIsLoading(true)
    try {
      // Get current worker assignments
      const currentWorkerIds = task.workerAssignments?.map(wa => wa.worker.id) || []
      
      // Remove selected workers from the current list
      const remainingWorkerIds = currentWorkerIds.filter(id => !selectedWorkers.includes(id))

      const response = await fetch(`/api/tasks/${task.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personIds: remainingWorkerIds
        }),
      })

      if (response.ok) {
        toast.success(`${selectedWorkers.length} trabajador(es) desasignado(s) exitosamente`)
        onSuccess()
        onOpenChange(false)
        setSelectedWorkers([])
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al desasignar trabajadores')
      }
    } catch (error) {
      console.error('Error unassigning workers:', error)
      toast.error('Error al desasignar trabajadores')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedWorkers([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Desasignar Trabajadores</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Selecciona los trabajadores que deseas desasignar de la tarea <strong>"{task.name}"</strong>
            </p>
            
                         {task.workerAssignments && task.workerAssignments.length > 0 ? (
               <div className="space-y-3">
                 {task.workerAssignments.map((assignment, index) => (
                   <div key={`${assignment.worker.id}-${index}`} className="flex items-center space-x-3">
                     <Checkbox
                       id={assignment.worker.id}
                       checked={selectedWorkers.includes(assignment.worker.id)}
                       onCheckedChange={() => handleWorkerToggle(assignment.worker.id)}
                     />
                     <label
                       htmlFor={assignment.worker.id}
                       className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                     >
                       <div className="font-medium">{assignment.worker.name}</div>
                       <div className="text-xs text-gray-500">
                         Proyecto: {assignment.project.nameEs || assignment.project.name}
                       </div>
                     </label>
                   </div>
                 ))}
               </div>
             ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay trabajadores asignados a esta tarea
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUnassign}
              disabled={isLoading || selectedWorkers.length === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Desasignando...' : `Desasignar (${selectedWorkers.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
