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
}

interface User {
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
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      fetchUsers()
      // Set currently assigned users
      setSelectedUserIds(task.assignedUsers.map(assignment => assignment.user.id))
    }
  }, [open, task])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        // Filter to only show WORKER users
        const workerUsers = data.users.filter((user: User) => user.role === 'WORKER')
        setUsers(workerUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
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
          userIds: selectedUserIds,
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

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentlyAssignedUsers = task.assignedUsers.map(assignment => assignment.user)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Task: {task.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-sm">{task.category.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Project</p>
                  <p className="text-sm">{task.project.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Progress Unit</p>
                  <p className="text-sm">{task.progressUnit}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-sm">{task.status}</p>
                </div>
              </div>
              {task.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm">{task.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Currently Assigned */}
          {currentlyAssignedUsers.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Currently Assigned</h4>
              <div className="flex flex-wrap gap-2">
                {currentlyAssignedUsers.map((user) => (
                  <Badge key={user.id} variant="outline">
                    {user.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User Selection */}
          <div>
            <h4 className="font-medium mb-2">Select Workers to Assign</h4>
            <Input
              type="text"
              placeholder="Search workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id)
                const isCurrentlyAssigned = currentlyAssignedUsers.some(assigned => assigned.id === user.id)
                
                return (
                  <div
                    key={user.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {isCurrentlyAssigned && (
                          <p className="text-xs text-blue-600">Currently assigned</p>
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
            
            {filteredUsers.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                {searchTerm ? 'No workers found matching your search' : 'No workers available'}
              </p>
            )}
          </div>

          {/* Summary */}
          {selectedUserIds.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Assignment Summary</h4>
              <p className="text-sm text-gray-600">
                This task will be assigned to {selectedUserIds.length} worker{selectedUserIds.length !== 1 ? 's' : ''}.
                {task.assignedUsers.length > 0 && selectedUserIds.length === 0 && (
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
              {loading ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
