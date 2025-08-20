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

  const handleAssignCompany = () => {
    setIsAssignCompanyModalOpen(true)
  }

  const handleAssignTeam = () => {
    setIsAssignTeamModalOpen(true)
  }

  const handleAssignProject = () => {
    setIsAssignProjectModalOpen(true)
  }

  const handleEndAssignment = (type: string, id: string) => {
    if (confirm(`¿Está seguro de que desea terminar esta asignación?`)) {
      // TODO: Implement assignment ending
      console.log(`Ending ${type} assignment: ${id}`)
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
                onClick={handleAssignCompany}
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
                      <div className="text-sm text-gray-500">Rol: {company.role}</div>
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

          {/* Teams */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Equipos Actuales
              </h2>
              <button
                onClick={handleAssignTeam}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {user.currentAssignments.teams.length > 0 ? (
                user.currentAssignments.teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-gray-500">Empresa: {team.company}</div>
                      <div className="text-xs text-gray-400">
                        Desde: {new Date(team.startDate).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEndAssignment('team', team.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Terminar
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay equipos asignados</p>
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
                onClick={handleAssignProject}
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
                      <div className="text-sm text-gray-500">Rol: {project.role} | Empresa: {project.company}</div>
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

      {/* Modals would go here - keeping them simple for now */}
      {isAssignCompanyModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asignar Empresa</h3>
              <p className="text-gray-600 mb-4">Funcionalidad en desarrollo</p>
              <button
                onClick={() => setIsAssignCompanyModalOpen(false)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isAssignTeamModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asignar Equipo</h3>
              <p className="text-gray-600 mb-4">Funcionalidad en desarrollo</p>
              <button
                onClick={() => setIsAssignTeamModalOpen(false)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isAssignProjectModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asignar Proyecto</h3>
              <p className="text-gray-600 mb-4">Funcionalidad en desarrollo</p>
              <button
                onClick={() => setIsAssignProjectModalOpen(false)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
