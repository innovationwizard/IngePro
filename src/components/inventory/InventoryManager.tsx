'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Filter,
  RefreshCw,
  ShoppingCart,
  Truck,
  Archive
} from 'lucide-react'

interface Material {
  id: string
  name: string
  nameEs?: string
  unit: string
  unitCost?: number
  minStockLevel?: number
  maxStockLevel?: number
  currentStock: number
  status: string
}

interface InventoryMovement {
  id: string
  type: string
  quantity: number
  unitCost?: number
  totalCost?: number
  reference?: string
  notes?: string
  recordedAt: string
  material: {
    name: string
    nameEs?: string
  }
}

interface ReorderRequest {
  id: string
  requestedQuantity: number
  status: string
  requestedAt: string
  approvedAt?: string
  orderedAt?: string
  receivedAt?: string
  orderNumber?: string
  rejectionReason?: string
  material: {
    name: string
    nameEs?: string
    currentStock: number
  }
}

interface InventoryManagerProps {
  materials: Material[]
}

export default function InventoryManager({ materials }: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [reorderRequests, setReorderRequests] = useState<ReorderRequest[]>([])
  const [summary, setSummary] = useState<any>(null)
  
  // Filters
  const [filters, setFilters] = useState({
    materialId: 'all',
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  })

  // Modal states
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showReorderModal, setShowReorderModal] = useState(false)
  const [showReorderActionModal, setShowReorderActionModal] = useState(false)
  const [selectedReorderRequest, setSelectedReorderRequest] = useState<ReorderRequest | null>(null)

  // Form states
  const [movementForm, setMovementForm] = useState({
    materialId: '',
    type: 'PURCHASE',
    quantity: 0,
    unitCost: 0,
    reference: '',
    notes: ''
  })

  const [reorderForm, setReorderForm] = useState({
    materialId: '',
    requestedQuantity: 0,
    notes: ''
  })

  const [actionForm, setActionForm] = useState({
    action: 'approve',
    orderNumber: '',
    rejectionReason: ''
  })

  useEffect(() => {
    fetchInventoryData()
  }, [filters])

  const fetchInventoryData = async () => {
    setLoading(true)
    try {
      // Fetch movements
      const movementsParams = new URLSearchParams()
      if (filters.materialId !== 'all') movementsParams.append('materialId', filters.materialId)
      if (filters.type !== 'all') movementsParams.append('type', filters.type)
      if (filters.startDate) movementsParams.append('startDate', filters.startDate)
      if (filters.endDate) movementsParams.append('endDate', filters.endDate)

      const movementsResponse = await fetch(`/api/inventory/movements?${movementsParams}`)
      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json()
        setMovements(movementsData.movements)
        setSummary(movementsData.summary)
      }

      // Fetch reorder requests
      const reorderParams = new URLSearchParams()
      if (filters.materialId !== 'all') reorderParams.append('materialId', filters.materialId)
      if (filters.status !== 'all') reorderParams.append('status', filters.status)
      if (filters.startDate) reorderParams.append('startDate', filters.startDate)
      if (filters.endDate) reorderParams.append('endDate', filters.endDate)

      const reorderResponse = await fetch(`/api/inventory/reorder-requests?${reorderParams}`)
      if (reorderResponse.ok) {
        const reorderData = await reorderResponse.json()
        setReorderRequests(reorderData.reorderRequests)
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementForm)
      })

      if (response.ok) {
        setShowMovementModal(false)
        setMovementForm({
          materialId: '',
          type: 'PURCHASE',
          quantity: 0,
          unitCost: 0,
          reference: '',
          notes: ''
        })
        fetchInventoryData()
      }
    } catch (error) {
      console.error('Error creating movement:', error)
    }
  }

  const handleReorderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/inventory/reorder-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reorderForm)
      })

      if (response.ok) {
        setShowReorderModal(false)
        setReorderForm({
          materialId: '',
          requestedQuantity: 0,
          notes: ''
        })
        fetchInventoryData()
      }
    } catch (error) {
      console.error('Error creating reorder request:', error)
    }
  }

  const handleReorderAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReorderRequest) return

    try {
      const response = await fetch(`/api/inventory/reorder-requests/${selectedReorderRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionForm)
      })

      if (response.ok) {
        setShowReorderActionModal(false)
        setSelectedReorderRequest(null)
        setActionForm({
          action: 'approve',
          orderNumber: '',
          rejectionReason: ''
        })
        fetchInventoryData()
      }
    } catch (error) {
      console.error('Error updating reorder request:', error)
    }
  }

  const getStockStatus = (material: Material) => {
    if (!material.minStockLevel) return 'normal'
    if (material.currentStock <= material.minStockLevel) return 'low'
    if (material.currentStock >= (material.maxStockLevel || material.minStockLevel * 2)) return 'high'
    return 'normal'
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-red-600'
      case 'high': return 'text-yellow-600'
      default: return 'text-green-600'
    }
  }

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'low': return <Badge className="bg-red-100 text-red-800">Stock Bajo</Badge>
      case 'high': return <Badge className="bg-yellow-100 text-yellow-800">Stock Alto</Badge>
      default: return <Badge className="bg-green-100 text-green-800">Stock Normal</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'ORDERED': 'bg-purple-100 text-purple-800',
      'RECEIVED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    }
    return <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'SALE': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'TRANSFER': return <Package className="w-4 h-4 text-blue-600" />
      case 'ADJUSTMENT': return <RefreshCw className="w-4 h-4 text-yellow-600" />
      case 'LOSS': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'RETURN': return <Archive className="w-4 h-4 text-purple-600" />
      default: return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Cargando inventario...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Inventario</h3>
          <p className="text-sm text-gray-600">
            Control de stock, movimientos y solicitudes de reorden
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInventoryData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setShowMovementModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Movimiento
          </Button>
          <Button onClick={() => setShowReorderModal(true)} variant="outline">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Solicitar Reorden
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <Select 
                value={filters.materialId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, materialId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los materiales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los materiales</SelectItem>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.nameEs || material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Movimiento
              </label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="PURCHASE">Compra</SelectItem>
                  <SelectItem value="SALE">Venta</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                  <SelectItem value="LOSS">Pérdida</SelectItem>
                  <SelectItem value="RETURN">Devolución</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Reorden
              </label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="APPROVED">Aprobado</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                  <SelectItem value="ORDERED">Ordenado</SelectItem>
                  <SelectItem value="RECEIVED">Recibido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="reorders">Reordenes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Materiales</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {materials.length}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                    <p className="text-2xl font-bold text-red-600">
                      {materials.filter(m => getStockStatus(m) === 'low').length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reordenes Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {reorderRequests.filter(req => req.status === 'PENDING').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${materials.reduce((sum, m) => sum + (m.currentStock * (m.unitCost || 0)), 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas de Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materials.filter(m => getStockStatus(m) === 'low').map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <p className="font-medium text-red-800">{material.nameEs || material.name}</p>
                      <p className="text-sm text-red-600">
                        Stock actual: {material.currentStock} {material.unit}
                        {material.minStockLevel && ` (Mínimo: ${material.minStockLevel})`}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setReorderForm({
                          materialId: material.id,
                          requestedQuantity: (material.minStockLevel || 10) * 2,
                          notes: 'Reorden automática por stock bajo'
                        })
                        setShowReorderModal(true)
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Reordenar
                    </Button>
                  </div>
                ))}
                {materials.filter(m => getStockStatus(m) === 'low').length === 0 && (
                  <p className="text-center text-gray-500 py-4">No hay alertas de stock bajo</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado del Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{material.nameEs || material.name}</h4>
                        {getStockStatusBadge(getStockStatus(material))}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Stock actual: {material.currentStock} {material.unit}
                        {material.unitCost && ` • Costo: $${material.unitCost}/${material.unit}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getStockStatusColor(getStockStatus(material))}`}>
                        {material.currentStock} {material.unit}
                      </p>
                      {material.minStockLevel && (
                        <p className="text-sm text-gray-500">
                          Mín: {material.minStockLevel} | Máx: {material.maxStockLevel || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Movimientos de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getMovementTypeIcon(movement.type)}
                      <div>
                        <p className="font-medium">{movement.material.nameEs || movement.material.name}</p>
                        <p className="text-sm text-gray-600">
                          {movement.type} • {new Date(movement.recordedAt).toLocaleDateString()}
                        </p>
                        {movement.reference && (
                          <p className="text-sm text-gray-500">Ref: {movement.reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </p>
                      {movement.totalCost && (
                        <p className="text-sm text-gray-600">${movement.totalCost.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
                {movements.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No hay movimientos registrados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reorders Tab */}
        <TabsContent value="reorders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Solicitudes de Reorden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reorderRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{request.material.nameEs || request.material.name}</h4>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Cantidad solicitada: {request.requestedQuantity} • 
                        Stock actual: {request.material.currentStock} • 
                        Solicitado: {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                      {request.orderNumber && (
                        <p className="text-sm text-gray-500">Orden: {request.orderNumber}</p>
                      )}
                      {request.rejectionReason && (
                        <p className="text-sm text-red-600">Motivo: {request.rejectionReason}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'PENDING' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedReorderRequest(request)
                              setActionForm({ action: 'approve', orderNumber: '', rejectionReason: '' })
                              setShowReorderActionModal(true)
                            }}
                          >
                            Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedReorderRequest(request)
                              setActionForm({ action: 'reject', orderNumber: '', rejectionReason: '' })
                              setShowReorderActionModal(true)
                            }}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                      {request.status === 'APPROVED' && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedReorderRequest(request)
                            setActionForm({ action: 'order', orderNumber: '', rejectionReason: '' })
                            setShowReorderActionModal(true)
                          }}
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Ordenar
                        </Button>
                      )}
                      {request.status === 'ORDERED' && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedReorderRequest(request)
                            setActionForm({ action: 'receive', orderNumber: '', rejectionReason: '' })
                            setShowReorderActionModal(true)
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Recibir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {reorderRequests.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No hay solicitudes de reorden</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movement Modal */}
      <Dialog open={showMovementModal} onOpenChange={setShowMovementModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento de Inventario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMovementSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Material
              </label>
              <Select 
                value={movementForm.materialId} 
                onValueChange={(value) => setMovementForm(prev => ({ ...prev, materialId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.nameEs || material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Movimiento
              </label>
              <Select 
                value={movementForm.type} 
                onValueChange={(value) => setMovementForm(prev => ({ ...prev, type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PURCHASE">Compra</SelectItem>
                  <SelectItem value="SALE">Venta</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                  <SelectItem value="LOSS">Pérdida</SelectItem>
                  <SelectItem value="RETURN">Devolución</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cantidad
              </label>
              <Input
                type="number"
                step="0.01"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Costo por Unidad
              </label>
              <Input
                type="number"
                step="0.01"
                value={movementForm.unitCost}
                onChange={(e) => setMovementForm(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Referencia
              </label>
              <Input
                value={movementForm.reference}
                onChange={(e) => setMovementForm(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="PO, factura, etc."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notas
              </label>
              <Input
                value={movementForm.notes}
                onChange={(e) => setMovementForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Crear Movimiento
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowMovementModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reorder Modal */}
      <Dialog open={showReorderModal} onOpenChange={setShowReorderModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Reorden</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReorderSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Material
              </label>
              <Select 
                value={reorderForm.materialId} 
                onValueChange={(value) => setReorderForm(prev => ({ ...prev, materialId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.nameEs || material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cantidad Solicitada
              </label>
              <Input
                type="number"
                step="0.01"
                value={reorderForm.requestedQuantity}
                onChange={(e) => setReorderForm(prev => ({ ...prev, requestedQuantity: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notas
              </label>
              <Input
                value={reorderForm.notes}
                onChange={(e) => setReorderForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Crear Solicitud
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowReorderModal(false)}
              >
                Cancelar
 </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reorder Action Modal */}
      <Dialog open={showReorderActionModal} onOpenChange={setShowReorderActionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionForm.action === 'approve' && 'Aprobar Reorden'}
              {actionForm.action === 'reject' && 'Rechazar Reorden'}
              {actionForm.action === 'order' && 'Ordenar Material'}
              {actionForm.action === 'receive' && 'Recibir Material'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReorderAction} className="space-y-4">
            {actionForm.action === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del Rechazo
                </label>
                <Input
                  value={actionForm.rejectionReason}
                  onChange={(e) => setActionForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  required
                  placeholder="Especificar motivo del rechazo"
                />
              </div>
            )}

            {actionForm.action === 'order' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Orden
                </label>
                <Input
                  value={actionForm.orderNumber}
                  onChange={(e) => setActionForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                  required
                  placeholder="PO, factura, etc."
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {actionForm.action === 'approve' && 'Aprobar'}
                {actionForm.action === 'reject' && 'Rechazar'}
                {actionForm.action === 'order' && 'Ordenar'}
                {actionForm.action === 'receive' && 'Recibir'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowReorderActionModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
