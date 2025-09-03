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
import PWAStatus from '@/components/PWAStatus'
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

// Vercel logging function
const logToVercel = (action: string, details: any = {}) => {
  console.log(`[VERCEL_LOG] ${action}:`, details)
  // In production, this will show up in Vercel logs
}

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

  // Fetch dashboard stats for Admin and Supervisor users
  useEffect(() => {
    const fetchDashboardStats = async () => {
      console.log('🔍 fetchDashboardStats called with session:', session)
      console.log('🔍 User role:', session?.user?.role)
      
      if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
        console.log('❌ Session or role check failed, setting loading to false')
        setIsLoading(false)
        return
      }

      try {
        console.log('🚀 Making API calls for role:', session.user?.role)
        const [companiesRes, projectsRes, workLogsRes, projectStatsRes] = await Promise.all([
          fetch('/api/companies', { credentials: 'include' }),
          fetch('/api/projects', { credentials: 'include' }),
          fetch('/api/worklog', { credentials: 'include' }),
          fetch('/api/projects/stats', { credentials: 'include' })
        ])
        
        console.log('📊 API responses:', {
          companies: companiesRes.status,
          projects: projectsRes.status,
          workLogs: workLogsRes.status,
          projectStats: projectStatsRes.status
        })

        if (companiesRes.ok && projectsRes.ok && workLogsRes.ok && projectStatsRes.ok) {
          const [companiesData, projectsData, workLogsData, projectStatsData] = await Promise.all([
            companiesRes.json(),
            projectsRes.json(),
            workLogsRes.json(),
            projectStatsRes.json()
          ])
          
          console.log('📈 Parsed data:', {
            companies: companiesData.companies?.length || 0,
            projects: projectsData.projects?.length || 0,
            workLogs: workLogsData.workLogs?.length || 0,
            projectStats: projectStatsData.projectStats?.length || 0
          })

          // Calculate stats
          const totalPeople = companiesData.companies.reduce((acc: number, company: any) => 
            acc + (company.people || 0), 0)
          const totalProjects = projectsData.projects.length
          const totalWorkHours = (workLogsData.workLogs || []).reduce((acc: number, log: any) => 
            acc + (log.duration || 0), 0) / 60 // Convert minutes to hours
          const activeWorkLogs = (workLogsData.workLogs || []).filter((log: any) => 
            log.status === 'ACTIVE').length

          const calculatedStats = {
            totalPeople,
            totalProjects,
            totalWorkHours: Math.round(totalWorkHours * 10) / 10,
            activeWorkLogs,
            companies: (companiesData.companies || []).map((company: any) => ({
              id: company.id,
              name: company.name,
              peopleCount: company.people || 0,
              projectCount: company.projects || 0,
              totalHours: Math.round((company.workLogs || 0) / 60 * 10) / 10 // Convert workLogs to hours
            })),
            projects: (projectsData.projects || []).map((project: any) => {
              // Find matching stats for this project
              const projectStats = (projectStatsData.projectStats || []).find((stats: any) => stats.id === project.id)
              
              return {
                id: project.id,
                name: project.name,
                company: project.company.name,
                peopleCount: projectStats?.peopleCount || 0,
                totalHours: Math.round((projectStats?.workLogCount || 0) / 60 * 10) / 10, // Convert workLogs to hours
                status: project.status
              }
            }),
            recentActivity: (workLogsData.workLogs || []).slice(0, 5).map((log: any) => ({
              id: log.id,
              type: 'work_log',
              description: `${log.person.name} ${log.status === 'ACTIVE' ? 'inició' : 'completó'} trabajo`,
              timestamp: log.createdAt,
              person: log.person.name
            }))
          }
          
          console.log('🎯 Final calculated stats:', calculatedStats)
          setStats(calculatedStats)
        } else {
          console.log('❌ Some API calls failed:', {
            companies: companiesRes.status,
            projects: projectsRes.status,
            workLogs: workLogsRes.status,
            projectStats: projectStatsRes.status
          })
          
          // Log response details for failed calls
          if (!companiesRes.ok) {
            const errorText = await companiesRes.text()
            console.log('❌ Companies API error:', errorText)
          }
          if (!projectsRes.ok) {
            const errorText = await projectsRes.text()
            console.log('❌ Projects API error:', errorText)
          }
          if (!workLogsRes.ok) {
            const errorText = await workLogsRes.text()
            console.log('❌ WorkLogs API error:', errorText)
          }
          if (!projectStatsRes.ok) {
            const errorText = await projectStatsRes.text()
            console.log('❌ ProjectStats API error:', errorText)
          }
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

  // Admin Dashboard (with stats)
  if (session?.user?.role === 'ADMIN') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {currentTime.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              {currentTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </div>
          </div>
        </div>

        {/* PWA Status */}
        <PWAStatus />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="mobile-card">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Total Personas</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.totalPeople || 0}</p>
                  </div>
                </div>
              </div>

              <div className="mobile-card">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Proyectos Activos</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.totalProjects || 0}</p>
                  </div>
                </div>
              </div>

              <div className="mobile-card">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Horas Trabajadas</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.totalWorkHours || 0}h</p>
                  </div>
                </div>
              </div>

              <div className="mobile-card">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Sesiones Activas</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.activeWorkLogs || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Companies Overview */}
              <div className="mobile-card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Empresas
                </h2>
                <div className="space-y-4">
                  {(stats?.companies || []).map((company) => (
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
              <div className="mobile-card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Proyectos
                </h2>
                <div className="space-y-4">
                  {(stats?.projects || []).slice(0, 5).map((project) => (
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
            <div className="mobile-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Actividad Reciente
              </h2>
              <div className="space-y-3">
                {(stats?.recentActivity || []).map((activity) => (
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
    console.log('🔍 Rendering Supervisor Dashboard')
    console.log('🔍 Session:', session)
    console.log('🔍 Stats:', stats)
    console.log('🔍 Loading:', isLoading)
    
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Panel de Supervisión
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {currentTime.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              {currentTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </div>
          </div>
        </div>

        {/* PWA Status */}
        <PWAStatus />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Debug Info */}
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
              <strong>Debug Info:</strong><br/>
              Loading: {isLoading.toString()}<br/>
              Stats: {stats ? 'Loaded' : 'Not loaded'}<br/>
              Total People: {stats?.totalPeople || 'N/A'}<br/>
              Total Projects: {stats?.totalProjects || 'N/A'}<br/>
              Total Work Hours: {stats?.totalWorkHours || 'N/A'}<br/>
              Active Work Logs: {stats?.activeWorkLogs || 'N/A'}<br/>
              Session Role: {session?.user?.role || 'N/A'}<br/>
              Session ID: {session?.user?.id || 'N/A'}
            </div>
            
            {/* Key Metrics for Supervisor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="mobile-card">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Personas Asignadas</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.totalPeople || 0}</p>
                  </div>
                </div>
              </div>

              <div className="mobile-card">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Mis Proyectos</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.totalProjects || 0}</p>
                  </div>
                </div>
              </div>

              <div className="mobile-card">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Horas del Equipo</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.totalWorkHours || 0}h</p>
                  </div>
                </div>
              </div>

              <div className="mobile-card">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Sesiones Activas</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.activeWorkLogs || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Overview for Supervisor */}
            <div className="mobile-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Mis Proyectos
              </h2>
              <div className="space-y-4">
                {(stats?.projects || []).length > 0 ? (
                  (stats.projects || []).slice(0, 5).map((project) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay proyectos asignados
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity for Supervisor */}
            <div className="mobile-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Actividad Reciente del Equipo
              </h2>
              <div className="space-y-3">
                {(stats?.recentActivity || []).length > 0 ? (
                  (stats.recentActivity || []).map((activity) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay actividad reciente
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Worker Dashboard (existing functionality)
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {es.dashboard.welcome}, {session?.user?.name}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {currentTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-2xl md:text-3xl font-bold text-blue-600">
            {currentTime.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </div>
        </div>
      </div>

      {/* PWA Status */}
      <PWAStatus />

      {/* Active Shift Banner - Show when worker is clocked in */}
      {isClockedIn && currentWorkLog && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-700 rounded-xl p-6 text-center shadow-xl">
          <div className="flex items-center justify-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">¡Su jornada está activa!</h2>
              <p className="text-green-100 text-lg">
                Entrada registrada a las {currentWorkLog.clockIn.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <div className="mt-3 inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full">
                <span className="text-white font-medium">
                  ⏱️ Tiempo transcurrido: {Math.floor((currentTime.getTime() - currentWorkLog.clockIn.getTime()) / (1000 * 60))} minutos
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:space-y-6">
        <div className="space-y-4 md:space-y-6">
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
