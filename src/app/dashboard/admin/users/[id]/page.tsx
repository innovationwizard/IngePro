'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Calendar, Building, Users, Target, Mail, Clock } from 'lucide-react'

interface UserAssignment {
  id: string
  name: string
  role: string
  startDate: string
  endDate: string | null
  company?: string
}

interface UserData {
  id: string
  name: string
  email: string
  status: string
  role: string
  createdAt: string
  currentAssignments: {
    companies: UserAssignment[]
    teams: UserAssignment[]
    projects: UserAssignment[]
  }
  history: UserAssignment[]
}

export default function UserDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [isAssignCompanyModalOpen, setIsAssignCompanyModalOpen] = useState(false)
  const [isAssignTeamModalOpen, setIsAssignTeamModalOpen] = useState(false)
  const [isAssignProjectModalOpen, setIsAssignProjectModalOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [assignFormData, setAssignFormData] = useState({
    companyId: '',
    role: 'WORKER' as 'WORKER' | 'SUPERVISOR' | 'ADMIN'
  })
  const [availableCompanies, setAvailableCompanies] = useState<Array<{id: string, name: string}>>([])
  
  const [assignProjectFormData, setAssignProjectFormData] = useState({
    projectId: '',
    role: 'WORKER' as 'WORKER' | 'SUPERVISOR'
  })
  const [availableProjects, setAvailableProjects] = useState<Array<{id: string, name: string, company: {name: string}}>>([])

  // Check if user is admin
  if (session?.user?.role !== 'ADMIN') {
    router.push('/dashboard')
    return null
  }

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData()
  }, [userId])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setError('Error al cargar los datos del usuario')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setAvailableCompanies(data.companies || [])
      } else {
        console.error('Error fetching companies')
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchAvailableProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setAvailableProjects(data.projects || [])
      } else {
        console.error('Error fetching projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleOpenAssignCompanyModal = () => {
    fetchAvailableCompanies() // Fetch companies when opening modal
    setIsAssignCompanyModalOpen(true)
  }

  const handleAssignTeam = () => {
    setIsAssignTeamModalOpen(true)
  }

  const handleOpenAssignProjectModal = () => {
    fetchAvailableProjects() // Fetch projects when opening modal
    setIsAssignProjectModalOpen(true)
  }

  const handleEndAssignment = async (type: string, id: string) => {
    if (confirm(`¿Está seguro de que desea terminar esta asignación?`)) {
      setIsActionLoading(true)
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end-assignment',
            assignmentId: id,
            assignmentType: type
          })
        })

        const data = await response.json()

        if (response.ok) {
          setMessage(data.message)
          fetchUserData() // Refresh user data
        } else {
          setMessage(data.error || 'Error al terminar la asignación')
        }
      } catch (error) {
        console.error('Error ending assignment:', error)
        setMessage('Error de conexión')
      } finally {
        setIsActionLoading(false)
      }
    }
  }

  const handleAssignCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsActionLoading(true)
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign-company',
          assignmentId: '',
          assignmentType: 'company',
          companyId: assignFormData.companyId,
          role: assignFormData.role
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setIsAssignCompanyModalOpen(false)
        setAssignFormData({ companyId: '', role: 'WORKER' })
        fetchUserData() // Refresh user data
      } else {
        setMessage(data.error || 'Error al asignar usuario')
      }
    } catch (error) {
      console.error('Error assigning user:', error)
      setMessage('Error de conexión')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsActionLoading(true)
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign-project',
          assignmentId: '',
          assignmentType: 'project',
          projectId: assignProjectFormData.projectId,
          role: assignProjectFormData.role
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setIsAssignProjectModalOpen(false)
        setAssignProjectFormData({ projectId: '', role: 'WORKER' })
        fetchUserData() // Refresh user data
      } else {
        setMessage(data.error || 'Error al asignar proyecto')
      }
    } catch (error) {
      console.error('Error assigning project:', error)
      setMessage('Error de conexión')
    } finally {
      setIsActionLoading(false)
    }
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

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Error</h1>
            <p className="text-gray-600">{error || 'Usuario no encontrado'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-600 flex items-center">
            <Mail className="h-4 w-4 mr-1" />
            {user.email}
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Usuario</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol Principal</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user.role}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
            <p className="text-sm text-gray-900 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {new Date(user.createdAt).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Companies */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Empresas Actuales
              </h2>
              <button
                onClick={handleOpenAssignCompanyModal}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {user.currentAssignments.companies.length > 0 ? (
                user.currentAssignments.companies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-gray-500">Rol: {user.role}</div>
                      <div className="text-xs text-gray-400">
                        Desde: {new Date(company.startDate).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEndAssignment('company', company.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Terminar
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay empresas asignadas</p>
              )}
            </div>
          </div>



          {/* Projects */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Proyectos Actuales
              </h2>
              <button
                onClick={handleOpenAssignProjectModal}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {user.currentAssignments.projects.length > 0 ? (
                user.currentAssignments.projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-gray-500">Rol: {user.role} | Empresa: {project.company}</div>
                      <div className="text-xs text-gray-400">
                        Desde: {new Date(project.startDate).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEndAssignment('project', project.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Terminar
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay proyectos asignados</p>
              )}
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Historial
            </h2>
            <div className="space-y-3">
              {user.history.length > 0 ? (
                user.history.map((entry, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-medium">{entry.name}</div>
                    <div className="text-sm text-gray-500">Rol: {entry.role}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(entry.startDate).toLocaleDateString('es-ES')} - 
                      {entry.endDate ? new Date(entry.endDate).toLocaleDateString('es-ES') : 'Actual'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay historial disponible</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg z-50">
          {message}
        </div>
      )}

      {/* Assign Company Modal */}
      {isAssignCompanyModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asignar a Empresa</h3>
              <form onSubmit={handleAssignCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Empresa</label>
                  <select
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={assignFormData.companyId}
                    onChange={(e) => setAssignFormData({ ...assignFormData, companyId: e.target.value })}
                  >
                    <option value="">Seleccionar empresa</option>
                    {availableCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={assignFormData.role}
                    onChange={(e) => setAssignFormData({ ...assignFormData, role: e.target.value as any })}
                  >
                    <option value="WORKER">Trabajador</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAssignCompanyModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isActionLoading ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Project Modal */}
      {isAssignProjectModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asignar a Proyecto</h3>
              <form onSubmit={handleAssignProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Proyecto</label>
                  <select
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={assignProjectFormData.projectId}
                    onChange={(e) => setAssignProjectFormData({ ...assignProjectFormData, projectId: e.target.value })}
                  >
                    <option value="">Seleccionar proyecto</option>
                    {availableProjects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.company.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={assignProjectFormData.role}
                    onChange={(e) => setAssignProjectFormData({ ...assignProjectFormData, role: e.target.value as any })}
                  >
                    <option value="WORKER">Trabajador</option>
                    <option value="SUPERVISOR">Supervisor</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAssignProjectModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isActionLoading ? 'Asignando...' : 'Asignar'}
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
