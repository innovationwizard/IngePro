'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface TaskProjectUnassignModalProps {
  task: {
    id: string
    name: string
    projectAssignments?: Array<{
      project: {
        id: string
        name: string
        nameEs?: string
      }
    }>
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function TaskProjectUnassignModal({ task, open, onOpenChange, onSuccess }: TaskProjectUnassignModalProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleUnassign = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Por favor selecciona al menos un proyecto para desasignar')
      return
    }

    console.log('🗑️ Frontend: Starting project unassignment for task:', task.id)
    console.log('🗑️ Frontend: Selected projects to remove:', selectedProjects)
    console.log('🗑️ Frontend: Current project assignments:', task.projectAssignments?.map(pa => pa.project.id) || [])

    setIsLoading(true)
    try {
      // Get current project assignments
      const currentProjectIds = task.projectAssignments?.map(pa => pa.project.id) || []
      
      // Remove selected projects from the current list
      const remainingProjectIds = currentProjectIds.filter(id => !selectedProjects.includes(id))

      console.log('🗑️ Frontend: Project IDs to keep after unassignment:', remainingProjectIds)

      const response = await fetch(`/api/tasks/${task.id}/unassign-projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectIds: remainingProjectIds
        }),
      })

      console.log('🗑️ Frontend: Unassignment API response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('🗑️ Frontend: Unassignment successful, result:', result)
        toast.success(`${selectedProjects.length} proyecto(s) desasignado(s) exitosamente`)
        onSuccess()
        onOpenChange(false)
        setSelectedProjects([])
      } else {
        const error = await response.json()
        console.log('🗑️ Frontend: Unassignment failed, error:', error)
        toast.error(error.error || 'Error al desasignar proyectos')
      }
    } catch (error) {
      console.error('Error unassigning projects:', error)
      toast.error('Error al desasignar proyectos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedProjects([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Desasignar Proyectos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Selecciona los proyectos que deseas desasignar de la tarea <strong>"{task.name}"</strong>
            </p>
            
            {task.projectAssignments && task.projectAssignments.length > 0 ? (
              <div className="space-y-3">
                {task.projectAssignments.map((assignment, index) => (
                  <div key={`${assignment.project.id}-${index}`} className="flex items-center space-x-3">
                    <Checkbox
                      id={assignment.project.id}
                      checked={selectedProjects.includes(assignment.project.id)}
                      onCheckedChange={() => handleProjectToggle(assignment.project.id)}
                    />
                    <label
                      htmlFor={assignment.project.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div className="font-medium">{assignment.project.nameEs || assignment.project.name}</div>
                      <div className="text-xs text-gray-500">
                        Proyecto ID: {assignment.project.id}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay proyectos asignados a esta tarea
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
              disabled={isLoading || selectedProjects.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? 'Desasignando...' : `Desasignar (${selectedProjects.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
