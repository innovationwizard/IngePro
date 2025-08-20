'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Building, Users, Calendar, Target } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  createdAt: string
  company: {
    id: string
    name: string
  }
  userCount: number
  userProjects: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
    }
    role: string
  }>
}

interface Company {
  id: string
  name: string
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    companyId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  })

  // Check if user is authenticated
  if (!session) {
    router.push('/auth/login')
    return null
  }

  // Check if user has permission
  if (!['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
    router.push('/dashboard')
    return null
  }

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects and stats...')
      const [projectsRes, statsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/projects/stats')
      ])
      
      if (projectsRes.ok && statsRes.ok) {
        const [projectsData, statsData] = await Promise.all([
          projectsRes.json(),
          statsRes.json()
        ])
        
        console.log('Projects data received:', projectsData)
        console.log('Stats data received:', statsData)
        
        // Merge projects with their stats
        const projectsWithStats = projectsData.projects.map((project: any) => {
          const projectStats = statsData.projectStats.find((stats: any) => stats.id === project.id)
          return {
            ...project,
            userCount: projectStats?.userCount || 0
          }
        })
        
        setProjects(projectsWithStats || [])
      } else {
        console.error('Error fetching data:', projectsRes.status, statsRes.status)
        setProjects([]) // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
      } else {
        console.error('Error fetching companies')
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchCompanies()
  }, [])

  const handleCreateProject = () => {
    setIsEditMode(false)
    setFormData({
      id: '',
      name: '',
      description: '',
      companyId: '',
      status: 'ACTIVE'
    })
    setIsModalOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setIsEditMode(true)
    setFormData({
      id: project.id,
      name: project.name,
      description: project.description,
      companyId: project.company.id,
      status: project.status
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditMode ? '/api/projects' : '/api/projects'
      const method = isEditMode ? 'PUT' : 'POST'
      const body = isEditMode ? { ...formData } : { ...formData, id: undefined }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setIsModalOpen(false)
        setFormData({
          id: '',
          name: '',
          description: '',
          companyId: '',
          status: 'ACTIVE'
        })
        
        // Add the new project to the local state immediately
        if (data.project && !isEditMode) {
          setProjects(prevProjects => [data.project, ...prevProjects])
        }
        
        // Also refresh from server to ensure consistency
        setTimeout(() => {
          fetchProjects()
        }, 500)
      } else {
        setMessage(data.error || 'Error al procesar el proyecto')
      }
    } catch (error) {
      console.error('Error saving project:', error)
      setMessage('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo'
      case 'INACTIVE':
        return 'Inactivo'
      case 'COMPLETED':
        return 'Completado'
      default:
        return status
    }
  }

  if (isLoading && projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Proyectos</h1>
          <p className="text-gray-600">Gestión y seguimiento de proyectos</p>
        </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Proyectos</h1>
          <p className="text-gray-600">Gestión y seguimiento de proyectos</p>
        </div>
        <button
          onClick={handleCreateProject}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Proyecto
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects && projects.length > 0 ? projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Building className="h-4 w-4 mr-1" />
                  {project.company.name}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              <button
                onClick={() => handleEditProject(project)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {project.userCount || 0} usuarios
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(project.createdAt).toLocaleDateString('es-ES')}
                </div>
              </div>
              

            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-8">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
            <p className="text-gray-500 mb-4">Crea tu primer proyecto para comenzar.</p>
            <button
              onClick={handleCreateProject}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Crear Proyecto
            </button>
          </div>
        )}
      </div>



      {/* Create/Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditMode ? 'Editar Proyecto' : 'Crear Proyecto'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Empresa</label>
                  <select
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  >
                    <option value="">Seleccionar empresa</option>
                    {companies && companies.length > 0 ? companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    )) : (
                      <option value="" disabled>No hay empresas disponibles</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="COMPLETED">Completado</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
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