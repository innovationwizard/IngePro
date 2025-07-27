'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Calendar, Building, Users, Target } from 'lucide-react'

export default function UserDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  // Mock user data
  const [user, setUser] = useState({
    id: userId,
    name: 'Juan Pérez',
    email: 'worker@demo.com',
    status: 'ACTIVE',
    currentAssignments: {
      companies: [
        { id: '1', name: 'Empresa de Construcción Demo', role: 'WORKER', startDate: '2024-01-15', endDate: null }
      ],
      teams: [
        { id: '1', name: 'Equipo A', company: 'Empresa de Construcción Demo', startDate: '2024-01-15', endDate: null },
        { id: '2', name: 'Equipo B', company: 'Empresa de Construcción Demo', startDate: '2024-02-01', endDate: null }
      ],
      projects: [
        { id: '1', name: 'Proyecto Centro', company: 'Empresa de Construcción Demo', role: 'WORKER', startDate: '2024-01-15', endDate: null },
        { id: '2', name: 'Proyecto Norte', company: 'Empresa de Construcción Demo', role: 'WORKER', startDate: '2024-02-01', endDate: null }
      ]
    },
    history: [
      { company: 'Constructora del Norte', role: 'WORKER', startDate: '2023-06-01', endDate: '2023-12-31' },
      { company: 'Empresa de Construcción Demo', role: 'WORKER', startDate: '2024-01-15', endDate: null }
    ]
  })

  const [isAssignCompanyModalOpen, setIsAssignCompanyModalOpen] = useState(false)
  const [isAssignTeamModalOpen, setIsAssignTeamModalOpen] = useState(false)
  const [isAssignProjectModalOpen, setIsAssignProjectModalOpen] = useState(false)

  // Check if user is admin
  if (session?.user?.role !== 'ADMIN') {
    router.push('/dashboard')
    return null
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
      // Update the assignment end date
      console.log(`Ending ${type} assignment: ${id}`)
    }
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
          <p className="text-gray-600">{user.email}</p>
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
              {user.currentAssignments.companies.map((company: any) => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-gray-500">{company.role}</div>
                    <div className="text-xs text-gray-400">
                      Desde: {new Date(company.startDate).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEndAssignment('company', company.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Terminar
                  </button>
                </div>
              ))}
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
                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {user.currentAssignments.teams.map((team: any) => (
                <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{team.name}</div>
                    <div className="text-sm text-gray-500">{team.company}</div>
                    <div className="text-xs text-gray-400">
                      Desde: {new Date(team.startDate).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEndAssignment('team', team.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Terminar
                  </button>
                </div>
              ))}
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
                className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {user.currentAssignments.projects.map((project: any) => (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-500">{project.role} - {project.company}</div>
                    <div className="text-xs text-gray-400">
                      Desde: {new Date(project.startDate).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEndAssignment('project', project.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Terminar
                  </button>
                </div>
              ))}
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
              {user.history.map((entry: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="font-medium">{entry.company}</div>
                  <div className="text-sm text-gray-500">{entry.role}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(entry.startDate).toLocaleDateString('es-ES')} - 
                    {entry.endDate ? new Date(entry.endDate).toLocaleDateString('es-ES') : 'Actual'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modals would go here */}
    </div>
  )
}
