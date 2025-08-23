'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClockInCard } from '@/components/dashboard/ClockInCard'
import { ProjectSelector } from '@/components/dashboard/ProjectSelector'
import { LocationTracker } from '@/components/dashboard/LocationTracker'
import { RecentWorkLogs } from '@/components/dashboard/RecentWorkLogs'
import { useWorkLogStore } from '@/store'
import { es } from '@/lib/translations/es'
import { 
  Users, 
  Building, 
  Target, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react'

interface DashboardStats {
  totalPeople: number
  totalProjects: number
  totalWorkHours: number
  activeWorkLogs: number
  companies: Array<{
    id: string
    name: string
    peopleCount: number
    projectCount: number
    totalHours: number
  }>
  projects: Array<{
    id: string
    name: string
    company: string
    peopleCount: number
    totalHours: number
    status: string
  }>
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    person: string
  }>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { isClockedIn, currentWorkLog } = useWorkLogStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Redirect superusers to their dashboard
  useEffect(() => {
    if (session?.user?.role === 'SUPERUSER') {
      router.push('/dashboard/superuser')
    }
  }, [session, router])

  // Fetch dashboard stats for Admin users
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!session || session.user?.role !== 'ADMIN') {
        setIsLoading(false)
        return
      }

      try {
        const [companiesRes, projectsRes, workLogsRes, projectStatsRes] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/projects'),
          fetch('/api/worklog'),
          fetch('/api/projects/stats')
        ])

        if (companiesRes.ok && projectsRes.ok && workLogsRes.ok && projectStatsRes.ok) {
          const [companiesData, projectsData, workLogsData, projectStatsData] = await Promise.all([
            companiesRes.json(),
            projectsRes.json(),
            workLogsRes.json(),
            projectStatsRes.json()
          ])

          // Calculate stats
          const totalPeople = companiesData.companies.reduce((acc: number, company: any) => 
            acc + (company.people || 0), 0)
          const totalProjects = projectsData.projects.length
          const totalWorkHours = workLogsData.workLogs.reduce((acc: number, log: any) => 
            acc + (log.duration || 0), 0) / 60 // Convert minutes to hours
          const activeWorkLogs = workLogsData.workLogs.filter((log: any) => 
            log.status === 'ACTIVE').length

          setStats({
            totalPeople,
            totalProjects,
            totalWorkHours: Math.round(totalWorkHours * 10) / 10,
            activeWorkLogs,
            companies: companiesData.companies.map((company: any) => ({
              id: company.id,
              name: company.name,
              peopleCount: company.people || 0,
              projectCount: company.projects || 0,
              totalHours: Math.round((company.workLogs || 0) / 60 * 10) / 10 // Convert workLogs to hours
            })),
            projects: projectsData.projects.map((project: any) => {
              // Find matching stats for this project
              const projectStats = projectStatsData.projectStats.find((stats: any) => stats.id === project.id)
              
              return {
                id: project.id,
                name: project.name,
                company: project.company.name,
                peopleCount: projectStats?.peopleCount || 0,
                totalHours: Math.round((projectStats?.workLogCount || 0) / 60 * 10) / 10, // Convert workLogs to hours
                status: project.status
              }
            }),
            recentActivity: workLogsData.workLogs.slice(0, 5).map((log: any) => ({
              id: log.id,
              type: 'work_log',
              description: `${log.person.name} ${log.status === 'ACTIVE' ? 'inició' : 'completó'} trabajo`,
              timestamp: log.createdAt,
              person: log.person.name
            }))
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [session])

  // Don't render the regular dashboard for superusers
  if (session?.user?.role === 'SUPERUSER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Admin Dashboard
  if (session?.user?.role === 'ADMIN') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="text-gray-600">
              {currentTime.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {currentTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Personas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalPeople || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Proyectos Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalProjects || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Horas Trabajadas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalWorkHours || 0}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeWorkLogs || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Companies Overview */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Empresas
                </h2>
                <div className="space-y-4">
                  {stats?.companies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">
                          {company.peopleCount} personas • {company.projectCount} proyectos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{company.totalHours}h</div>
                        <div className="text-xs text-gray-500">total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects Overview */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Proyectos
                </h2>
                <div className="space-y-4">
                  {stats?.projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-sm text-gray-500">
                          {project.company} • {project.peopleCount} personas
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{project.totalHours}h</div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Actividad Reciente
              </h2>
              <div className="space-y-3">
                {stats?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Supervisor Dashboard
  if (session?.user?.role === 'SUPERVISOR') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Supervisión
            </h1>
            <p className="text-gray-600">
              {currentTime.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {currentTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics for Supervisor */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Personas Asignadas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalPeople || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Mis Proyectos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalProjects || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Horas del Equipo</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalWorkHours || 0}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeWorkLogs || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Overview for Supervisor */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Mis Proyectos
              </h2>
              <div className="space-y-4">
                {stats?.projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500">
                        {project.company} • {project.peopleCount} personas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{project.totalHours}h</div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity for Supervisor */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Actividad Reciente del Equipo
              </h2>
              <div className="space-y-3">
                {stats?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Worker Dashboard (existing functionality)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {es.dashboard.welcome}, {session?.user?.name}
          </h1>
          <p className="text-gray-600">
            {currentTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {currentTime.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ClockInCard />
          <ProjectSelector />
          <LocationTracker />
        </div>
        <div>
          <RecentWorkLogs />
        </div>
      </div>
    </div>
  )
}
