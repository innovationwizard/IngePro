'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Building, Users, Calendar } from 'lucide-react'

// Vercel logging function
const logToVercel = (action: string, details: any = {}) => {
  console.log(`[VERCEL_LOG] ${action}:`, details)
  // In production, this will show up in Vercel logs
}

interface Company {
  id: string
  name: string
  nameEs?: string
  slug: string
  status: string
  createdAt: string
  users: number
  projects: number
  workLogs: number
  role?: string
}

export default function AdminTenantsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [message, setMessage] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    nameEs: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL'
  })

  // Check if user is admin
  if (session?.user?.role !== 'ADMIN') {
    router.push('/dashboard')
    return null
  }

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    logToVercel('ADMIN_TENANTS_FETCH_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies)
        
        logToVercel('ADMIN_TENANTS_FETCH_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          companiesCount: data.companies?.length || 0,
          timestamp: new Date().toISOString()
        })
      } else {
        logToVercel('ADMIN_TENANTS_FETCH_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          status: response.status,
          timestamp: new Date().toISOString()
        })
        console.error('Failed to fetch companies')
        setMessage('Error al cargar las empresas')
      }
    } catch (error) {
      logToVercel('ADMIN_TENANTS_FETCH_ERROR', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('Error fetching companies:', error)
      setMessage('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCompany = () => {
    logToVercel('ADMIN_ADD_COMPANY_MODAL_OPENED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
    
    setFormData({ name: '', nameEs: '', status: 'ACTIVE' })
    setIsAddModalOpen(true)
  }

  const handleEditCompany = (company: Company) => {
    logToVercel('ADMIN_EDIT_COMPANY_MODAL_OPENED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      targetCompanyId: company.id,
      targetCompanyName: company.name,
      targetCompanyStatus: company.status,
      timestamp: new Date().toISOString()
    })
    
    setSelectedCompany(company)
    setFormData({
      name: company.name,
      nameEs: company.nameEs || '',
      status: company.status as any
    })
    setIsEditModalOpen(true)
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    
    logToVercel('ADMIN_CREATE_COMPANY_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      companyName: formData.name,
      companyNameEs: formData.nameEs,
      companyStatus: formData.status,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug: formData.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        })
      })

      const data = await response.json()

      if (response.ok) {
        logToVercel('ADMIN_CREATE_COMPANY_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          companyName: formData.name,
          companyNameEs: formData.nameEs,
          companyStatus: formData.status,
          timestamp: new Date().toISOString()
        })
        
        setIsAddModalOpen(false)
        setMessage('Empresa creada exitosamente. Redirigiendo...')
        // Refresh the page to update the session and show the new company
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        logToVercel('ADMIN_CREATE_COMPANY_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          companyName: formData.name,
          companyNameEs: formData.nameEs,
          companyStatus: formData.status,
          error: data.error,
          status: response.status,
          timestamp: new Date().toISOString()
        })
        setMessage(data.error || 'Error al crear empresa')
      }
    } catch (error) {
      logToVercel('ADMIN_CREATE_COMPANY_ERROR', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        companyName: formData.name,
        companyNameEs: formData.nameEs,
        companyStatus: formData.status,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('Error creating company:', error)
      setMessage('Error de conexión')
    }
  }

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCompany) return

    logToVercel('ADMIN_UPDATE_COMPANY_ATTEMPTED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      targetCompanyId: selectedCompany.id,
      targetCompanyName: selectedCompany.name,
      oldStatus: selectedCompany.status,
      newStatus: formData.status,
      timestamp: new Date().toISOString()
    })

    const updateData = {
      id: selectedCompany.id,
      slug: selectedCompany.slug,
      ...formData
    }

    try {
      const response = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (response.ok) {
        logToVercel('ADMIN_UPDATE_COMPANY_SUCCESS', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          targetCompanyId: selectedCompany.id,
          targetCompanyName: selectedCompany.name,
          oldStatus: selectedCompany.status,
          newStatus: formData.status,
          timestamp: new Date().toISOString()
        })
        
        setIsEditModalOpen(false)
        setSelectedCompany(null)
        fetchCompanies()
        setMessage('Empresa actualizada exitosamente')
      } else {
        logToVercel('ADMIN_UPDATE_COMPANY_FAILED', {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          targetCompanyId: selectedCompany.id,
          targetCompanyName: selectedCompany.name,
          error: data.error,
          status: response.status,
          timestamp: new Date().toISOString()
        })
        setMessage(data.error || 'Error al actualizar empresa')
      }
    } catch (error) {
      logToVercel('ADMIN_UPDATE_COMPANY_ERROR', {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        targetCompanyId: selectedCompany.id,
        targetCompanyName: selectedCompany.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('Error updating company:', error)
      setMessage('Error de conexión')
    }
  }

  const handleModalClose = (modalType: 'add' | 'edit') => {
    logToVercel('ADMIN_TENANTS_MODAL_CLOSED', {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      modalType,
      timestamp: new Date().toISOString()
    })
    
    if (modalType === 'add') {
      setIsAddModalOpen(false)
    } else if (modalType === 'edit') {
      setIsEditModalOpen(false)
      setSelectedCompany(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activo' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactivo' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspendido' },
      TRIAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Prueba' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
          <p className="text-gray-600">Administrar empresas y organizaciones</p>
        </div>
        <button
          onClick={handleAddCompany}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Empresa</span>
        </button>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      <div className="bg-white shadow-sm border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Empresas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuarios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyectos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                                              <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{company.nameEs || company.name}</div>
                          <div className="text-sm text-gray-500">ID: {company.id}</div>
                          <div className="text-xs text-gray-400">Slug: {company.slug}</div>
                          {company.role && (
                            <div className="text-xs text-blue-600">Tu rol: {company.role}</div>
                          )}
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{company.users}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{company.projects}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(company.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(company.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCompany(company)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Empresa</h3>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Nombre de la empresa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre corto</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Nombre corto"
                    value={formData.nameEs}
                    onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select 
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="SUSPENDED">Suspendido</option>
                    <option value="TRIAL">Prueba</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => handleModalClose('add')}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isEditModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Empresa</h3>
              <form onSubmit={handleUpdateCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug (identificador único)</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                    value={selectedCompany?.slug || ''}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">El slug no se puede modificar</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre corto</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.nameEs}
                    onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select 
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="SUSPENDED">Suspendido</option>
                    <option value="TRIAL">Prueba</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => handleModalClose('edit')}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
