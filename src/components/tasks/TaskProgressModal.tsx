'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
}

interface MaterialConsumption {
  materialId: string
  quantity: number
}

interface MaterialLoss {
  materialId: string
  quantity: number
}

interface TaskProgressModalProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function TaskProgressModal({ task, open, onOpenChange, onSuccess }: TaskProgressModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amountCompleted: '',
    additionalAttributes: '',
    materialConsumptions: [] as MaterialConsumption[],
    materialLosses: [] as MaterialLoss[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountCompleted: parseFloat(formData.amountCompleted),
          additionalAttributes: formData.additionalAttributes || undefined,
          materialConsumptions: formData.materialConsumptions.length > 0 ? formData.materialConsumptions : undefined,
          materialLosses: formData.materialLosses.length > 0 ? formData.materialLosses : undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Progress logged successfully:', result)
        onSuccess()
        onOpenChange(false)
        // Reset form
        setFormData({
          amountCompleted: '',
          additionalAttributes: '',
          materialConsumptions: [],
          materialLosses: []
        })
      } else {
        const error = await response.json()
        console.error('Error logging progress:', error)
        alert(error.error || 'Failed to log progress')
      }
    } catch (error) {
      console.error('Error logging progress:', error)
      alert('Failed to log progress')
    } finally {
      setLoading(false)
    }
  }

  const addMaterialConsumption = () => {
    if (task.taskMaterials.length === 0) return
    
    const availableMaterials = task.taskMaterials.filter(material => 
      !formData.materialConsumptions.some(consumption => consumption.materialId === material.material.id)
    )
    
    if (availableMaterials.length > 0) {
      setFormData(prev => ({
        ...prev,
        materialConsumptions: [
          ...prev.materialConsumptions,
          {
            materialId: availableMaterials[0].material.id,
            quantity: 0
          }
        ]
      }))
    }
  }

  const removeMaterialConsumption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materialConsumptions: prev.materialConsumptions.filter((_, i) => i !== index)
    }))
  }

  const updateMaterialConsumption = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      materialConsumptions: prev.materialConsumptions.map((consumption, i) => 
        i === index ? { ...consumption, [field]: value } : consumption
      )
    }))
  }

  const addMaterialLoss = () => {
    if (task.taskMaterials.length === 0) return
    
    const availableMaterials = task.taskMaterials.filter(material => 
      !formData.materialLosses.some(loss => loss.materialId === material.material.id)
    )
    
    if (availableMaterials.length > 0) {
      setFormData(prev => ({
        ...prev,
        materialLosses: [
          ...prev.materialLosses,
          {
            materialId: availableMaterials[0].material.id,
            quantity: 0
          }
        ]
      }))
    }
  }

  const removeMaterialLoss = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materialLosses: prev.materialLosses.filter((_, i) => i !== index)
    }))
  }

  const updateMaterialLoss = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      materialLosses: prev.materialLosses.map((loss, i) => 
        i === index ? { ...loss, [field]: value } : loss
      )
    }))
  }

  const getAvailableMaterials = (type: 'consumption' | 'loss') => {
    const usedMaterials = type === 'consumption' 
      ? formData.materialConsumptions.map(c => c.materialId)
      : formData.materialLosses.map(l => l.materialId)
    
    return task.taskMaterials.filter(material => !usedMaterials.includes(material.material.id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Progress: {task.name}</DialogTitle>
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

          {/* Progress Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Completed ({task.progressUnit}) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amountCompleted}
              onChange={(e) => setFormData(prev => ({ ...prev, amountCompleted: e.target.value }))}
              placeholder={`Enter amount completed in ${task.progressUnit}`}
              required
            />
          </div>

          {/* Additional Attributes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Attributes (Optional)
            </label>
            <Input
              type="text"
              value={formData.additionalAttributes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalAttributes: e.target.value }))}
              placeholder="e.g., room A, north wall, etc."
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.additionalAttributes.length}/100 characters
            </p>
          </div>

          {/* Material Consumptions */}
          {task.taskMaterials.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Material Consumption
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterialConsumption}
                  disabled={getAvailableMaterials('consumption').length === 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Consumption
                </Button>
              </div>
              
              {formData.materialConsumptions.length > 0 ? (
                <div className="space-y-3">
                  {formData.materialConsumptions.map((consumption, index) => {
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
                          onChange={(e) => updateMaterialConsumption(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Quantity"
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMaterialConsumption(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No material consumption logged</p>
              )}
            </div>
          )}

          {/* Material Losses */}
          {task.taskMaterials.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Material Loss
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterialLoss}
                  disabled={getAvailableMaterials('loss').length === 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Loss
                </Button>
              </div>
              
              {formData.materialLosses.length > 0 ? (
                <div className="space-y-3">
                  {formData.materialLosses.map((loss, index) => {
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
                          onChange={(e) => updateMaterialLoss(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Quantity"
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMaterialLoss(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No material loss logged</p>
              )}
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
              disabled={loading || !formData.amountCompleted || parseFloat(formData.amountCompleted) <= 0}
            >
              {loading ? 'Logging...' : 'Log Progress'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
