'use client'

import { useState } from 'react'
import { useWorkLogStore, useProjectStore } from '@/store'
import { getCurrentLocation, isWithinBusinessHours } from '@/lib/utils'
import { toast } from 'sonner'
import { Clock, MapPin, AlertCircle } from 'lucide-react'
import { es } from '@/lib/translations/es'

export function ClockInCard() {
  const { isClockedIn, clockIn, clockOut, currentWorkLog, setCurrentWorkLog } = useWorkLogStore()
  const { currentProject } = useProjectStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleClockIn = async () => {
    if (!isWithinBusinessHours()) {
      toast.error(es.dashboard.businessHoursError)
      return
    }

    if (!currentProject) {
      toast.error('Por favor selecciona un proyecto antes de hacer clock in')
      return
    }

    setIsLoading(true)
    try {
      const location = await getCurrentLocation()
      
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
        throw new Error(errorData.error || 'Failed to create worklog')
      }

      const data = await response.json()
      
      // Update local state with the created worklog
      clockIn(currentProject.id, location)
      
      // Update the currentWorkLog with the actual data from the database
      if (data.workLog) {
        setCurrentWorkLog({
          id: data.workLog.id,
          personId: data.workLog.person.id,
          projectId: data.workLog.project?.id || '',
          clockIn: new Date(data.workLog.startTime),
          tasksCompleted: '[]',
          materialsUsed: '[]',
          photos: [],
          approved: false,
          createdAt: new Date(data.workLog.createdAt),
        })
      }
      
      toast.success(es.dashboard.successClockIn)
    } catch (error) {
      console.error('Error creating worklog:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el registro de trabajo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!currentWorkLog?.id) {
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
        throw new Error(errorData.error || 'Failed to update worklog')
      }

      // Update local state
      clockOut()
      toast.success(es.dashboard.successClockOut)
    } catch (error) {
      console.error('Error updating worklog:', error)
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
        {!isClockedIn ? (
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
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">{es.dashboard.currentlyWorking}</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {es.dashboard.clockedInAt} {currentWorkLog?.clockIn.toLocaleTimeString()}
              </p>
            </div>
            
            <button
              onClick={handleClockOut}
              className="btn-mobile bg-red-600 text-white hover:bg-red-700"
            >
              {es.dashboard.clockOut}
            </button>
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
    </div>
  )
}
