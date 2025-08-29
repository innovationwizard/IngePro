'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, X } from 'lucide-react'

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
  workerAssignments: Array<{
    worker: {
      id: string
      name: string
      role: string
    }
    project: {
      id: string
      name: string
      nameEs?: string
    }
  }>
}

interface Person {
  id: string
  name: string
  email: string
  role: string
}

interface TaskAssignmentModalProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function TaskAssignmentModal({ task, open, onOpenChange, onSuccess }: TaskAssignmentModalProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      fetchPeople()
      // Set currently assigned people
      setSelectedPersonIds(task.workerAssignments.map(assignment => assignment.worker.id))
    }
  }, [open, task])

  const fetchPeople = async () => {
    try {
      const response = await fetch('/api/people')
      if (response.ok) {
        const data = await response.json()
        // Filter to only show WORKER people
        const workerPeople = data.people.filter((person: Person) => person.role === 'WORKER')
        setPeople(workerPeople)
      }
    } catch (error) {
      console.error('Error fetching people:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personIds: selectedPersonIds,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Task assigned successfully:', result)
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await response.json()
        console.error('Error assigning task:', error)
        alert(error.error || 'Failed to assign task')
      }
    } catch (error) {
      console.error('Error assigning task:', error)
      alert('Failed to assign task')
    } finally {
      setLoading(false)
    }
  }

  const handlePersonToggle = (personId: string) => {
    setSelectedPersonIds(prev => 
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    )
  }

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentlyAssignedPeople = task.workerAssignments.map(assignment => assignment.worker)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Tarea: {task.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Tarea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Categoría</p>
                  <p className="text-sm">{task.category?.name || 'Sin categoría'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Proyecto</p>
                  <p className="text-sm">
                    {task.projectAssignments?.[0]?.project.name || 
                     task.workerAssignments?.[0]?.project.name || 
                     'Sin proyecto asignado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unidad de Progreso</p>
                  <p className="text-sm">{task.progressUnit}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <p className="text-sm">{task.status}</p>
                </div>
              </div>
              {task.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Descripción</p>
                  <p className="text-sm">{task.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Currently Assigned */}
          {currentlyAssignedPeople.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Actualmente Asignados</h4>
              <div className="flex flex-wrap gap-2">
                {currentlyAssignedPeople.map((person) => (
                  <Badge key={person.id} variant="outline">
                    {person.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User Selection */}
          <div>
            <h4 className="font-medium mb-2">Seleccionar Trabajadores para Asignar</h4>
            <Input
              type="text"
              placeholder="Buscar trabajadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredPeople.map((person) => {
                const isSelected = selectedPersonIds.includes(person.id)
                const isCurrentlyAssigned = currentlyAssignedPeople.some(assigned => assigned.id === person.id)
                
                return (
                  <div
                    key={person.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePersonToggle(person.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{person.name}</p>
                        <p className="text-xs text-gray-500">{person.email}</p>
                        {isCurrentlyAssigned && (
                          <p className="text-xs text-blue-600">Actualmente asignado</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {filteredPeople.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                {searchTerm ? 'No workers found matching your search' : 'No workers available'}
              </p>
            )}
          </div>

          {/* Summary */}
          {selectedPersonIds.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Assignment Summary</h4>
              <p className="text-sm text-gray-600">
                This task will be assigned to {selectedPersonIds.length} worker{selectedPersonIds.length !== 1 ? 's' : ''}.
                {task.workerAssignments.length > 0 && selectedPersonIds.length === 0 && (
                  <span className="text-orange-600"> All current assignments will be removed.</span>
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Asignando...' : 'Asignar Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
