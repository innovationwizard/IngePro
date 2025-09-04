'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Package, Building2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  nameEs?: string
  description?: string
}

interface Material {
  id: string
  name: string
  nameEs?: string
  unit: string
  currentStock: number
  status: string
}

interface MaterialAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  projects: Project[]
  materials: Material[]
}

export default function MaterialAssignmentModal({
  open,
  onOpenChange,
  onSuccess,
  projects,
  materials
}: MaterialAssignmentModalProps) {
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'low-stock'>('all')

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedProject('')
      setSelectedMaterials([])
      setSearchTerm('')
      setFilterStatus('all')
    }
  }, [open])

  // Filter materials based on search and status
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.nameEs && material.nameEs.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && material.status === 'ACTIVE') ||
                         (filterStatus === 'low-stock' && material.currentStock <= 10)
    
    return matchesSearch && matchesStatus
  })

  const handleMaterialToggle = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    )
  }

  const handleSelectAll = () => {
    if (selectedMaterials.length === filteredMaterials.length) {
      setSelectedMaterials([])
    } else {
      setSelectedMaterials(filteredMaterials.map(m => m.id))
    }
  }

  const handleAssign = async () => {
    if (!selectedProject) {
      toast.error('Por favor selecciona un proyecto')
      return
    }

    if (selectedMaterials.length === 0) {
      toast.error('Por favor selecciona al menos un material')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/materials/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProject,
          materialIds: selectedMaterials
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`${selectedMaterials.length} material(es) asignado(s) exitosamente al proyecto`)
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al asignar materiales')
      }
    } catch (error) {
      console.error('Error assigning materials:', error)
      toast.error('Error de conexión al asignar materiales')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedProjectData = projects.find(p => p.id === selectedProject)
  const selectedMaterialsData = materials.filter(m => selectedMaterials.includes(m.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Asignar Materiales a Proyecto
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
          {/* Left Panel - Project Selection & Summary */}
          <div className="w-full lg:w-1/3 space-y-4">
            {/* Project Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Proyecto
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent className="max-h-48 w-full bg-white border border-gray-200 shadow-lg modal-dropdown">
                  {projects.map((project) => (
                    <SelectItem 
                      key={project.id} 
                      value={project.id} 
                      className="py-3 px-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900 leading-tight">
                          {project.nameEs || project.name}
                        </span>
                        {project.nameEs && project.name !== project.nameEs && (
                          <span className="text-xs text-gray-500 mt-1 leading-tight">
                            {project.name}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Summary */}
            {selectedProjectData && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Resumen del Proyecto</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Nombre:</strong> {selectedProjectData.nameEs || selectedProjectData.name}</p>
                  {selectedProjectData.description && (
                    <p><strong>Descripción:</strong> {selectedProjectData.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Assignment Summary */}
            {selectedMaterialsData.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-blue-900 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Materiales a Asignar
                </h4>
                <div className="space-y-2">
                  {selectedMaterialsData.map((material) => (
                    <div key={material.id} className="flex items-center justify-between text-sm">
                      <span className="text-blue-800">{material.nameEs || material.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {material.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Total:</strong> {selectedMaterialsData.length} material(es)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Material Selection */}
          <div className="flex-1 min-h-0 flex flex-col space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar materiales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-auto min-w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-full bg-white border border-gray-200 shadow-lg modal-dropdown">
                    <SelectItem 
                      value="all" 
                      className="py-3 px-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <span className="font-medium text-sm text-gray-900">Todos los Materiales</span>
                    </SelectItem>
                    <SelectItem 
                      value="active" 
                      className="py-3 px-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <span className="font-medium text-sm text-gray-900">Solo Activos</span>
                    </SelectItem>
                    <SelectItem 
                      value="low-stock" 
                      className="py-3 px-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <span className="font-medium text-sm text-gray-900">Stock Bajo</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedMaterials.length === filteredMaterials.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </Button>
              </div>
            </div>

            {/* Materials List */}
            <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg">
              {filteredMaterials.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No se encontraron materiales</p>
                  {searchTerm && <p className="text-sm">Intenta con otros términos de búsqueda</p>}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMaterials.map((material) => (
                    <div
                      key={material.id}
                      className={`material-selection-item hover:bg-gray-50 transition-colors ${
                        selectedMaterials.includes(material.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={material.id}
                          checked={selectedMaterials.includes(material.id)}
                          onCheckedChange={() => handleMaterialToggle(material.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={material.id}
                                className="block font-medium text-gray-900 cursor-pointer touch-manipulation"
                              >
                                {material.nameEs || material.name}
                                {material.nameEs && material.name !== material.nameEs && (
                                  <span className="block text-sm text-gray-500 font-normal">
                                    {material.name}
                                  </span>
                                )}
                              </label>
                              
                              <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {material.unit}
                                </span>
                                
                                <span className={`flex items-center gap-1 ${
                                  material.currentStock <= 10 ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                  {material.currentStock <= 10 ? (
                                    <AlertCircle className="h-3 w-3" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                  Stock: {material.currentStock}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                variant={material.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {material.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleAssign}
            disabled={!selectedProject || selectedMaterials.length === 0 || isLoading}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Asignando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Asignar {selectedMaterials.length > 0 && `(${selectedMaterials.length})`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
