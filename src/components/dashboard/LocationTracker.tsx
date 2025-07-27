'use client'

import { useState, useEffect } from 'react'
import { useWorkLogStore } from '@/store'
import { getCurrentLocation } from '@/lib/utils'
import { MapPin, Wifi, WifiOff } from 'lucide-react'
import { es } from '@/lib/translations/es'

export function LocationTracker() {
  const { currentLocation, updateLocation } = useWorkLogStore()
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(async () => {
        try {
          const location = await getCurrentLocation()
          updateLocation(location)
          setError(null)
        } catch (err) {
          setError('No se pudo obtener la ubicación')
        }
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [isTracking, updateLocation])

  const startTracking = async () => {
    try {
      const location = await getCurrentLocation()
      updateLocation(location)
      setIsTracking(true)
      setError(null)
    } catch (err) {
      setError('Acceso a ubicación denegado')
    }
  }

  const stopTracking = () => {
    setIsTracking(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Seguimiento de Ubicación</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">Ubicación GPS</span>
          </div>
          <div className="flex items-center space-x-2">
            {isTracking ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-xs text-gray-500">
              {isTracking ? es.dashboard.active : es.dashboard.inactive}
            </span>
          </div>
        </div>

        {currentLocation && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">
              <div>{es.location.latitude}: {currentLocation.latitude.toFixed(6)}</div>
              <div>{es.location.longitude}: {currentLocation.longitude.toFixed(6)}</div>
              <div>{es.location.accuracy}: ±{currentLocation.accuracy.toFixed(1)}{es.location.meters}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex space-x-2">
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {es.dashboard.startTracking}
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              {es.dashboard.stopTracking}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
