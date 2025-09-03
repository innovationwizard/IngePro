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

interface Worker {
  id: string
  name: string
  email: string
  role: string
  isClockedIn: boolean
  currentWorkLogId?: string
  clockInTime?: string
}

// Worker Management Section Component
function WorkerManagementSection({ stats }: { stats: DashboardStats | null }) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [newStatus, setNewStatus] = useState<boolean>(false)

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/worklog', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        
        // Extract unique workers and their current status
        const workerMap = new Map<string, Worker>()
        
        // Group worklogs by worker and find the most recent active one for each
        const workerWorklogs = new Map<string, any[]>()
        
        // First, group all worklogs by worker ID
        data.workLogs.forEach((log: any) => {
          if (log.person.role === 'WORKER') {
            if (!workerWorklogs.has(log.person.id)) {
              workerWorklogs.set(log.person.id, [])
            }
            workerWorklogs.get(log.person.id)!.push(log)
          }
        })
        
        // For each worker, find their most recent active worklog (or most recent if none active)
        workerWorklogs.forEach((logs, workerId) => {
          // Sort by creation date, newest first
          const sortedLogs = logs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          
          // Find the most recent active worklog (no clockOut time)
          const activeWorklog = sortedLogs.find(log => !log.clockOut)
          
          // Use active worklog if found, otherwise use most recent completed one
          const mostRecentLog = activeWorklog || sortedLogs[0]
          
          const isClockedIn = !mostRecentLog.clockOut
          
          workerMap.set(workerId, {
            id: mostRecentLog.person.id,
            name: mostRecentLog.person.name,
            email: mostRecentLog.person.email,
            role: mostRecentLog.person.role,
            isClockedIn,
            currentWorkLogId: isClockedIn ? mostRecentLog.id : undefined,
            clockInTime: isClockedIn ? mostRecentLog.clockIn : undefined
          })
        })
        
        setWorkers(Array.from(workerMap.values()))
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = (worker: Worker, newStatus: boolean) => {
    setSelectedWorker(worker)
    setNewStatus(newStatus)
    setShowConfirmModal(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedWorker) return

    try {
      if (newStatus) {
        // Clock in worker
        const response = await fetch('/api/worklog/clock-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            personId: selectedWorker.id,
            projectId: stats?.projects?.[0]?.id || '', // Use first available project
            location: 'Manual entry by supervisor'
          })
        })
        
        if (response.ok) {
          // Refresh workers list
          fetchWorkers()
        }
      } else {
        // Clock out worker
        if (selectedWorker.currentWorkLogId) {
          const response = await fetch(`/api/worklog/${selectedWorker.currentWorkLogId}/clock-out`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              location: 'Manual entry by supervisor'
            })
          })
          
          if (response.ok) {
            // Refresh workers list
            fetchWorkers()
          }
        }
      }
    } catch (error) {
      console.error('Error changing worker status:', error)
    } finally {
      setShowConfirmModal(false)
      setSelectedWorker(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {workers.length > 0 ? (
          workers.map((worker) => (
            <div key={worker.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{worker.name}</div>
                  <div className="text-sm text-gray-500">{worker.email}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  worker.isClockedIn 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {worker.isClockedIn ? 'En turno' : 'Fuera de turno'}
                </span>
                
                <button
                  onClick={() => handleStatusChange(worker, !worker.isClockedIn)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    worker.isClockedIn
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {worker.isClockedIn ? 'Sacar del turno' : 'Poner en turno'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay trabajadores disponibles
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar cambio de estado
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro de que desea cambiar el estado de <strong>{selectedWorker.name}</strong> a{' '}
              <strong>{newStatus ? 'En turno' : 'Fuera de turno'}</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmStatusChange}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                  newStatus ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
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
      if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
        setIsLoading(false)
        return
      }

      try {
        const [companiesRes, projectsRes, workLogsRes, projectStatsRes] = await Promise.all([
          fetch('/api/companies', { credentials: 'include' }),
          fetch('/api/projects', { credentials: 'include' }),
          fetch('/api/worklog', { credentials: 'include' }),
          fetch('/api/projects/stats', { credentials: 'include' })
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
          const totalWorkHours = (workLogsData.workLogs || []).reduce((acc: number, log: any) => 
            acc + (log.duration || 0), 0) / 60 // Convert minutes to hours
          const activeWorkLogs = (workLogsData.workLogs || []).filter((log: any) => 
            log.status === 'ACTIVE').length

          setStats({
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
          });
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

            {/* Worker Management for Supervisor */}
            <div className="mobile-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Gestión de Trabajadores
              </h2>
              <div className="space-y-3">
                <WorkerManagementSection stats={stats} />
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
