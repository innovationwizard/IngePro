'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-react'

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
  taskMaterials: Array<{
    material: {
      id: string
      name: string
      unit: string
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
}

interface MaterialConsumption {
  materialId: string
  quantity: number
}

interface MaterialLoss {
  materialId: string
  quantity: number
}

interface TaskValidationModalProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function TaskValidationModal({ task, open, onOpenChange, onSuccess }: TaskValidationModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null)
  const [validationAction, setValidationAction] = useState<'ACCEPT' | 'MODIFY' | 'REJECT'>('ACCEPT')
  const [comments, setComments] = useState('')
  const [modifiedAmount, setModifiedAmount] = useState('')
  const [modifiedMaterialConsumptions, setModifiedMaterialConsumptions] = useState<MaterialConsumption[]>([])
  const [modifiedMaterialLosses, setModifiedMaterialLosses] = useState<MaterialLoss[]>([])

  useEffect(() => {
    if (open) {
      // Get the first pending update
      const pendingUpdate = task.progressUpdates.find(update => update.validationStatus === 'PENDING')
      if (pendingUpdate) {
        setSelectedUpdate(pendingUpdate)
        setModifiedAmount(pendingUpdate.amountCompleted.toString())
        
        // Initialize modified materials
        setModifiedMaterialConsumptions(
          pendingUpdate.materialConsumptions.map(consumption => ({
            materialId: task.taskMaterials.find(m => m.material.name === consumption.material.name)?.material.id || '',
            quantity: consumption.quantity
          }))
        )
        
        setModifiedMaterialLosses(
          pendingUpdate.materialLosses.map(loss => ({
            materialId: task.taskMaterials.find(m => m.material.name === loss.material.name)?.material.id || '',
            quantity: loss.quantity
          }))
        )
      }
    }
  }, [open, task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUpdate) return

    setLoading(true)

    try {
      const payload: any = {
        action: validationAction,
        comments: comments || undefined
      }

      if (validationAction === 'MODIFY') {
        if (modifiedAmount) {
          payload.modifiedAmount = parseFloat(modifiedAmount)
        }
        if (modifiedMaterialConsumptions.length > 0) {
          payload.modifiedMaterialConsumptions = modifiedMaterialConsumptions
        }
        if (modifiedMaterialLosses.length > 0) {
          payload.modifiedMaterialLosses = modifiedMaterialLosses
        }
      }

      const response = await fetch(`/api/tasks/progress/${selectedUpdate.id}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Progress validated successfully:', result)
        onSuccess()
        onOpenChange(false)
        // Reset form
        setValidationAction('ACCEPT')
        setComments('')
        setModifiedAmount('')
        setModifiedMaterialConsumptions([])
        setModifiedMaterialLosses([])
        setSelectedUpdate(null)
      } else {
        const error = await response.json()
        console.error('Error validating progress:', error)
        alert(error.error || 'Failed to validate progress')
      }
    } catch (error) {
      console.error('Error validating progress:', error)
      alert('Failed to validate progress')
    } finally {
      setLoading(false)
    }
  }

  const addModifiedMaterialConsumption = () => {
    const availableMaterials = task.taskMaterials.filter(material => 
      !modifiedMaterialConsumptions.some(consumption => consumption.materialId === material.material.id)
    )
    
    if (availableMaterials.length > 0) {
      setModifiedMaterialConsumptions(prev => [
        ...prev,
        {
          materialId: availableMaterials[0].material.id,
          quantity: 0
        }
      ])
    }
  }

  const removeModifiedMaterialConsumption = (index: number) => {
    setModifiedMaterialConsumptions(prev => prev.filter((_, i) => i !== index))
  }

  const updateModifiedMaterialConsumption = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
    setModifiedMaterialConsumptions(prev => prev.map((consumption, i) => 
      i === index ? { ...consumption, [field]: value } : consumption
    ))
  }

  const addModifiedMaterialLoss = () => {
    const availableMaterials = task.taskMaterials.filter(material => 
      !modifiedMaterialLosses.some(loss => loss.materialId === material.material.id)
    )
    
    if (availableMaterials.length > 0) {
      setModifiedMaterialLosses(prev => [
        ...prev,
        {
          materialId: availableMaterials[0].material.id,
          quantity: 0
        }
      ])
    }
  }

  const removeModifiedMaterialLoss = (index: number) => {
    setModifiedMaterialLosses(prev => prev.filter((_, i) => i !== index))
  }

  const updateModifiedMaterialLoss = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
    setModifiedMaterialLosses(prev => prev.map((loss, i) => 
      i === index ? { ...loss, [field]: value } : loss
    ))
  }

  const pendingUpdates = task.progressUpdates.filter(update => update.validationStatus === 'PENDING')

  if (!selectedUpdate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate Progress Updates</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">No pending progress updates to validate</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validate Progress Update</DialogTitle>
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
                  <p className="text-sm font-medium text-gray-500">Task</p>
                  <p className="text-sm">{task.name}</p>
                </div>
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
              </div>
            </CardContent>
          </Card>

          {/* Progress Update Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Update Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Worker</p>
                  <p className="text-sm">{selectedUpdate.user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-sm">{new Date(selectedUpdate.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount Completed</p>
                  <p className="text-sm font-semibold">{selectedUpdate.amountCompleted} {task.progressUnit}</p>
                </div>
                {selectedUpdate.additionalAttributes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Additional Info</p>
                    <p className="text-sm">{selectedUpdate.additionalAttributes}</p>
                  </div>
                )}
              </div>

              {/* Material Consumptions */}
              {selectedUpdate.materialConsumptions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Material Consumption</p>
                  <div className="space-y-2">
                    {selectedUpdate.materialConsumptions.map((consumption: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{consumption.material.name}</span>
                        <span className="text-sm font-medium">{consumption.quantity} {consumption.material.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Material Losses */}
              {selectedUpdate.materialLosses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Material Loss</p>
                  <div className="space-y-2">
                    {selectedUpdate.materialLosses.map((loss: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{loss.material.name}</span>
                        <span className="text-sm font-medium">{loss.quantity} {loss.material.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validation Action *
            </label>
            <Select value={validationAction} onValueChange={(value: any) => setValidationAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACCEPT">Accept with Comments</SelectItem>
                <SelectItem value="MODIFY">Modify and Accept</SelectItem>
                <SelectItem value="REJECT">Reject and Ask for Corrections</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add validation comments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Modification Fields */}
          {validationAction === 'MODIFY' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Modify Values</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Modified Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modified Amount ({task.progressUnit})
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={modifiedAmount}
                      onChange={(e) => setModifiedAmount(e.target.value)}
                      placeholder={`Enter modified amount in ${task.progressUnit}`}
                    />
                  </div>

                  {/* Modified Material Consumptions */}
                  {task.taskMaterials.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Modified Material Consumption
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addModifiedMaterialConsumption}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      {modifiedMaterialConsumptions.length > 0 ? (
                        <div className="space-y-3">
                          {modifiedMaterialConsumptions.map((consumption, index) => {
                            const material = task.taskMaterials.find(m => m.material.id === consumption.materialId)?.material
                            return (
                              <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{material?.name}</p>
                                  <p className="text-xs text-gray-500">{material?.unit}</p>
                                </div>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={consumption.quantity}
                                  onChange={(e) => updateModifiedMaterialConsumption(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  placeholder="Quantity"
                                  className="w-24"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeModifiedMaterialConsumption(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No material consumption modifications</p>
                      )}
                    </div>
                  )}

                  {/* Modified Material Losses */}
                  {task.taskMaterials.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Modified Material Loss
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addModifiedMaterialLoss}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      {modifiedMaterialLosses.length > 0 ? (
                        <div className="space-y-3">
                          {modifiedMaterialLosses.map((loss, index) => {
                            const material = task.taskMaterials.find(m => m.material.id === loss.materialId)?.material
                            return (
                              <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{material?.name}</p>
                                  <p className="text-xs text-gray-500">{material?.unit}</p>
                                </div>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={loss.quantity}
                                  onChange={(e) => updateModifiedMaterialLoss(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  placeholder="Quantity"
                                  className="w-24"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeModifiedMaterialLoss(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No material loss modifications</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Validation Summary</h4>
            <p className="text-sm text-gray-600">
              You are about to <strong>{validationAction.toLowerCase()}</strong> this progress update.
              {validationAction === 'MODIFY' && modifiedAmount && (
                <span> The amount will be changed from {selectedUpdate.amountCompleted} to {parseFloat(modifiedAmount)} {task.progressUnit}.</span>
              )}
              {validationAction === 'REJECT' && (
                <span> The worker will be asked to correct and resubmit.</span>
              )}
            </p>
          </div>

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
              variant={validationAction === 'REJECT' ? 'destructive' : 'default'}
            >
              {loading ? 'Validating...' : `Validate (${validationAction})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
