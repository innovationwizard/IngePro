'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useWorkLogStore, useProjectStore } from '@/store'
import { getCurrentLocation, isWithinBusinessHours } from '@/lib/utils'
import { toast } from 'sonner'
import { Clock, MapPin, AlertCircle, FileText, Plus } from 'lucide-react'
import { es } from '@/lib/translations/es'
import WorklogEntryForm from '@/components/worklog/WorklogEntryForm'

// Vercel logging function
const logToVercel = (action: string, details: any = {}) => {
  console.log(`[VERCEL_LOG] ${action}:`, details)
  // In production, this will show up in Vercel logs
}

export function ClockInCard() {
  console.log('🚀 ClockInCard component rendering...')
  
  const { data: session } = useSession()
  const { isClockedIn, clockIn, clockOut, currentWorkLog, setCurrentWorkLog } = useWorkLogStore()
  const { currentProject } = useProjectStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showWorklogEntry, setShowWorklogEntry] = useState(false)

  // Debug store state
  console.log('ClockInCard render - isClockedIn:', isClockedIn, 'currentWorkLog:', currentWorkLog)
  console.log('ClockInCard render - currentWorkLog.clockOut:', currentWorkLog?.clockOut)
  console.log('ClockInCard render - session user ID:', session?.user?.id)

  // Check if user is already clocked in when component mounts
  console.log('🔧 Setting up useEffect for current worklog check...')
  useEffect(() => {
    const checkCurrentWorklog = async () => {
      try {
        console.log('🔍 Checking current worklog for user:', session?.user?.id)
        const response = await fetch('/api/worklog/current')
        if (response.ok) {
          const data = await response.json()
          console.log('📋 Current worklog response:', data)
          if (data.workLog && !data.workLog.clockOut) {
            console.log('✅ User is already clocked in, updating store with:', data.workLog)
            // User is already clocked in, update the store
            setCurrentWorkLog(data.workLog)
            console.log('🔄 Store updated, isClockedIn should now be true')
          } else {
            console.log('❌ No active worklog found, workLog:', data.workLog)
          }
        } else {
          console.log('❌ Failed to fetch current worklog:', response.status)
        }
      } catch (error) {
        console.error('❌ Error checking current worklog:', error)
      }
    }

    if (session?.user?.id) {
      console.log('🚀 useEffect triggered, calling checkCurrentWorklog')
      checkCurrentWorklog()
    } else {
      console.log('⏳ Session not ready yet, user ID:', session?.user?.id)
    }
  }, [session?.user?.id]) // Removed setCurrentWorkLog from dependencies

  const handleClockIn = async () => {
    logToVercel('CLOCK_IN_ATTEMPTED', {
      userId: session?.user?.id,
      projectId: currentProject?.id,
      timestamp: new Date().toISOString(),
      businessHours: isWithinBusinessHours()
    })

    if (!isWithinBusinessHours()) {
      logToVercel('CLOCK_IN_FAILED_BUSINESS_HOURS', {
        userId: session?.user?.id,
        projectId: currentProject?.id,
        timestamp: new Date().toISOString()
      })
      toast.error(es.dashboard.businessHoursError)
      return
    }

    if (!currentProject) {
      logToVercel('CLOCK_IN_FAILED_NO_PROJECT', {
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      })
      toast.error('Por favor selecciona un proyecto antes de hacer clock in')
      return
    }

    setIsLoading(true)
    try {
      const location = await getCurrentLocation()
      
      logToVercel('LOCATION_OBTAINED', {
        userId: currentProject?.id,
        projectId: currentProject?.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date().toISOString()
      })
      
      // Call API to create worklog in database
      const response = await fetch('/api/worklog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: currentProject.id,
          description: `Clock in at ${new Date().toLocaleTimeString()}`
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        logToVercel('CLOCK_IN_API_ERROR', {
          userId: currentProject?.id,
          projectId: currentProject?.id,
          error: errorData.error,
          status: response.status,
          timestamp: new Date().toISOString()
        })
        throw new Error(errorData.error || 'Failed to create worklog')
      }

      const data = await response.json()
      
      logToVercel('CLOCK_IN_SUCCESS', {
        userId: currentProject?.id,
        projectId: currentProject?.id,
        worklogId: data.workLog?.id,
        timestamp: new Date().toISOString(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        }
      })
      
      // Update the currentWorkLog with the actual data from the database
      if (data.workLog) {
        console.log('🔄 Setting current worklog after successful clock-in:', data.workLog)
        setCurrentWorkLog({
          id: data.workLog.id,
          personId: data.workLog.person.id,
          projectId: data.workLog.project?.id || '',
          clockIn: new Date(data.workLog.startTime),
          clockOut: undefined, // Ensure this is undefined for active worklog
          tasksCompleted: '[]',
          materialsUsed: '[]',
          photos: [],
          approved: false,
          createdAt: new Date(data.workLog.createdAt),
          updatedAt: new Date(),
        })
        console.log('✅ Current worklog updated in store')
      }
      
      toast.success(es.dashboard.successClockIn)
    } catch (error) {
      console.error('Error creating worklog:', error)
      
      logToVercel('CLOCK_IN_ERROR', {
        userId: currentProject?.id,
        projectId: currentProject?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      
      // Mobile-specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Geolocation is not supported')) {
          toast.error('Tu dispositivo no soporta geolocalización. Por favor, activa la ubicación en tu navegador.')
        } else if (error.message.includes('Permission denied')) {
          toast.error('Permiso de ubicación denegado. Por favor, permite el acceso a la ubicación en tu navegador.')
        } else if (error.message.includes('timeout')) {
          toast.error('Tiempo de espera agotado al obtener ubicación. Verifica tu conexión GPS.')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Error al crear el registro de trabajo')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorklogEntrySaved = () => {
    // Refresh worklog data if needed
    toast.success('Registro de trabajo actualizado')
  }

  const handleClockOut = async () => {
    logToVercel('CLOCK_OUT_ATTEMPTED', {
      worklogId: currentWorkLog?.id,
      userId: currentWorkLog?.personId,
      projectId: currentWorkLog?.projectId,
      timestamp: new Date().toISOString()
    })

    if (!currentWorkLog?.id) {
      logToVercel('CLOCK_OUT_FAILED_NO_WORKLOG', {
        timestamp: new Date().toISOString()
      })
      toast.error('No hay un registro de trabajo activo')
      return
    }

    try {
      // Call API to update worklog with clock out time
      const response = await fetch('/api/worklog', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentWorkLog.id,
          endTime: new Date().toISOString(),
          description: `Clock out at ${new Date().toLocaleTimeString()}`
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        logToVercel('CLOCK_OUT_API_ERROR', {
          worklogId: currentWorkLog.id,
          userId: currentWorkLog.personId,
          projectId: currentWorkLog.projectId,
          error: errorData.error,
          status: response.status,
          timestamp: new Date().toISOString()
        })
        throw new Error(errorData.error || 'Failed to update worklog')
      }

      logToVercel('CLOCK_OUT_SUCCESS', {
        worklogId: currentWorkLog.id,
        userId: currentWorkLog.personId,
        projectId: currentWorkLog.projectId,
        timestamp: new Date().toISOString()
      })

      // Update local state
      clockOut()
      toast.success(es.dashboard.successClockOut)
    } catch (error) {
      console.error('Error updating worklog:', error)
      logToVercel('CLOCK_OUT_ERROR', {
        worklogId: currentWorkLog.id,
        userId: currentWorkLog.personId,
        projectId: currentWorkLog.projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el registro de trabajo')
    }
  }

  return (
    <div className="mobile-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-lg font-semibold text-gray-900">Seguimiento de Tiempo</h2>
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Ubicación Requerida</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Debug info */}
        <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
          Debug: isClockedIn={isClockedIn.toString()}, currentWorkLog={currentWorkLog ? 'exists' : 'null'}, clockOut={currentWorkLog?.clockOut ? 'set' : 'null'}
        </div>
        
        {!isClockedIn ? (
          <div>
            <div className="text-xs text-red-500 mb-2">DEBUG: Showing CLOCK IN button (isClockedIn=false)</div>
            <button
              onClick={handleClockIn}
              disabled={isLoading || !currentProject}
              className="btn-mobile bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="h-6 w-6" />
              <span>
                {isLoading ? es.dashboard.gettingLocation : 
                 !currentProject ? 'Selecciona un proyecto' : 
                 es.dashboard.clockIn}
              </span>
            </button>
          </div>
        ) : (
          <div>
            <div className="text-xs text-green-500 mb-2">DEBUG: Showing CLOCK OUT section (isClockedIn=true)</div>
          <div className="space-y-4">
            {/* Prominent green banner for shift confirmation */}
            <div className="bg-green-500 border-2 border-green-600 rounded-lg p-4 text-center shadow-lg">
              <div className="flex items-center justify-center space-x-3">
                <Clock className="h-8 w-8 text-white" />
                <div>
                  <h3 className="text-lg font-bold text-white">¡Su jornada ha iniciado!</h3>
                  <p className="text-green-100 text-sm">
                    Entrada registrada a las {currentWorkLog?.clockIn.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Project and status info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">{es.dashboard.currentlyWorking}</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {es.dashboard.clockedInAt} {currentWorkLog?.clockIn.toLocaleTimeString()}
              </p>
              {currentProject && (
                <div className="mt-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Proyecto: {currentProject.name}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setShowWorklogEntry(true)}
                className="btn-mobile bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>Registrar Trabajo</span>
              </button>
              
              <button
                onClick={handleClockOut}
                className="btn-mobile bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Clock className="h-4 w-4" />
                <span>{es.dashboard.clockOut}</span>
              </button>
            </div>
          </div>
          </div>
        )}

        {!isWithinBusinessHours() && (
          <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              {es.dashboard.outsideBusinessHours}
            </span>
          </div>
        )}
      </div>

      {/* Worklog Entry Form */}
      {showWorklogEntry && currentWorkLog && currentProject && (
        <WorklogEntryForm
          isOpen={showWorklogEntry}
          onClose={() => setShowWorklogEntry(false)}
          onEntrySaved={handleWorklogEntrySaved}
          currentWorklogId={currentWorkLog.id}
          projectId={currentProject.id}
          projectName={currentProject.name}
        />
      )}
    </div>
  )
}
