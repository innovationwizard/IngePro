'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Eye, User, Mail, Building, Calendar, Clock, Copy, Check } from 'lucide-react'

interface Person {
  id: string
  name: string
  email: string
  status: string
  role: string
  createdAt: string
  currentCompany: string
  currentTeams: string[]
  currentProjects: string[]
  hasPassword: boolean
}

interface InvitationData {
  link: string
  temporaryPassword: string
  expiresAt: string
}

export default function AdminPeoplePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'WORKER' as 'WORKER' | 'SUPERVISOR' | 'ADMIN'
  })

  // Check if person is admin
  if (session?.user?.role !== 'ADMIN') {
    router.push('/dashboard')
    return null
  }

  // Fetch people on component mount
  useEffect(() => {
    fetchPeople()
  }, [])

  const fetchPeople = async () => {
    try {
      const response = await fetch('/api/people')
      if (response.ok) {
        const data = await response.json()
        setPeople(data.people)
      } else {
        console.error('Failed to fetch people')
      }
    } catch (error) {
      console.error('Error fetching people:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPerson = () => {
    setFormData({ name: '', email: '', role: 'WORKER' })
    setIsAddModalOpen(true)
  }

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person)
    setIsEditModalOpen(true)
  }

  const handleRefreshSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Sesión actualizada! Ahora asociado con: ${data.company.name}`)
        // Refresh the page to see the users
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      alert('Error al actualizar la sesión')
    }
  }



  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setInvitationData(data.invitation)
        setIsAddModalOpen(false)
        fetchPeople() // Refresh people list
      } else {
        alert(data.error || 'Error creating person')
      }
    } catch (error) {
      console.error('Error creating person:', error)
      alert('Error creating person')
    }
  }

  const handleUpdatePerson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPerson) return

    try {
      const response = await fetch('/api/people', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPerson.id,
          name: formData.name,
          email: formData.email,
          role: formData.role
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsEditModalOpen(false)
        setSelectedPerson(null)
        fetchPeople() // Refresh people list
      } else {
        alert(data.error || 'Error updating person')
      }
    } catch (error) {
      console.error('Error updating person:', error)
      alert('Error updating person')
    }
  }

  const copyToClipboard = async (text: string, type: 'link' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'link') {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } else {
        setCopiedPassword(true)
        setTimeout(() => setCopiedPassword(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activo' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactivo' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspendido' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      WORKER: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Trabajador' },
      SUPERVISOR: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Supervisor' },
      ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Administrador' },
    }
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.WORKER
    
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Personas</h1>
          <p className="text-gray-600">Invitar y gestionar personas de la empresa</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAddPerson}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Invitar Persona</span>
          </button>
          <button
            onClick={handleRefreshSession}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <span>🔄 Actualizar Sesión</span>
          </button>
        </div>
      </div>

      {!isLoading && people.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No se encontraron usuarios
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Si acabas de crear tu empresa, es posible que necesites actualizar tu sesión 
                  para ver los usuarios asociados. Haz clic en "🔄 Actualizar Sesión" arriba.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Usuarios de la Empresa</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contraseña
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
              {people.length > 0 ? (
                people.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{person.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {person.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(person.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(person.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {person.hasPassword ? (
                        <span className="text-green-600">✓ Configurada</span>
                      ) : (
                        <span className="text-orange-600">⚠ Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(person.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/dashboard/admin/people/${person.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver Detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditPerson(person)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <User className="h-12 w-12 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">No hay usuarios registrados</h3>
                        <p className="text-gray-500 mt-1">
                          {isLoading ? 'Cargando usuarios...' : 'Comienza invitando personas a tu empresa'}
                        </p>
                      </div>
                      {!isLoading && (
                        <button
                          onClick={handleAddPerson}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Invitar Primera Persona</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Person Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invitar Persona</h3>
              <form onSubmit={handleCreatePerson} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                    placeholder="Nombre completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                    placeholder="email@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select 
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="WORKER">Trabajador</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Invitar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {isEditModalOpen && selectedPerson && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Persona</h3>
              <form onSubmit={handleUpdatePerson} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    required
                    defaultValue={selectedPerson.name}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    defaultValue={selectedPerson.email}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select 
                    defaultValue={selectedPerson.role}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="WORKER">Trabajador</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Success Modal */}
      {invitationData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Usuario Invitado Exitosamente</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enlace de Invitación</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={invitationData.link}
                      className="flex-1 block w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(invitationData.link, 'link')}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Copiar enlace"
                    >
                      {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Temporal</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={invitationData.temporaryPassword}
                      className="flex-1 block w-full border border-gray-300 rounded-md px-2 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(invitationData.temporaryPassword, 'password')}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Copiar contraseña"
                    >
                      {copiedPassword ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Instrucciones:</p>
                  <ul className="mt-1 list-disc list-inside">
                    <li>Comparte el enlace con el usuario</li>
                    <li>El usuario debe usar la contraseña temporal para acceder</li>
                    <li>Se le pedirá cambiar la contraseña en el primer acceso</li>
                  </ul>
                </div>
                <button
                  onClick={() => setInvitationData(null)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
