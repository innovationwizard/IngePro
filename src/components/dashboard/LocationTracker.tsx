'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useWorkLogStore } from '@/store'
import { getCurrentLocation } from '@/lib/utils'
import { MapPin, Wifi, WifiOff, Activity } from 'lucide-react'
import { es } from '@/lib/translations/es'

// Constants for delta thresholds
const DISTANCE_THRESHOLD = 10 // 10 meters
const HEADING_THRESHOLD = 15 // 15 degrees
const POLLING_INTERVALS = [60000, 120000, 240000, 480000, 960000] // 60s, 120s, 240s, 480s, 960s

export function LocationTracker() {
  const { currentLocation, updateLocation } = useWorkLogStore()
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState(60000) // Start with 60s
  const [isMoving, setIsMoving] = useState(false)
  const [lastLocation, setLastLocation] = useState<any>(null)
  const [updateCount, setUpdateCount] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const locationBuffer = useRef<any[]>([])
  const lastSignificantUpdate = useRef<number>(Date.now())

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }, [])

  // Calculate heading change
  const calculateHeadingChange = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const Δλ = (lon2 - lon1) * Math.PI / 180
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    
    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
    
    let heading = Math.atan2(y, x) * 180 / Math.PI
    heading = (heading + 360) % 360
    
    return heading
  }, [])

  // Send location update to server
  const sendLocationUpdate = useCallback(async (location: any, deltaDistance: number, deltaHeading: number, isSignificant: boolean) => {
    try {
      const response = await fetch('/api/location/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp || Date.now(),
          deltaDistance,
          deltaHeading,
          isSignificant
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.stored) {
          setUpdateCount(prev => prev + 1)
          lastSignificantUpdate.current = Date.now()
        }
      }
    } catch (error) {
      console.error('Failed to send location update:', error)
    }
  }, [])

  // Adaptive polling logic
  const startAdaptivePolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(async () => {
      try {
        const location = await getCurrentLocation()
        const now = Date.now()
        
        if (lastLocation) {
          const distance = calculateDistance(
            lastLocation.latitude, lastLocation.longitude,
            location.latitude, location.longitude
          )
          
          const heading = calculateHeadingChange(
            lastLocation.latitude, lastLocation.longitude,
            location.latitude, location.longitude
          )
          
          const headingChange = Math.abs(heading - (lastLocation.heading || 0))
          
          // Determine if this is a significant update
          const isSignificant = distance > DISTANCE_THRESHOLD || headingChange > HEADING_THRESHOLD
          
          // Update local state
          updateLocation(location)
          setLastLocation({ ...location, heading })
          
          // Send to server
          await sendLocationUpdate(location, distance, headingChange, isSignificant)
          
          // Adaptive polling based on movement
          if (isSignificant) {
            setIsMoving(true)
            setPollingInterval(60000) // Back to 60s when moving
          } else {
            // Back off polling when stationary
            const currentIndex = POLLING_INTERVALS.indexOf(pollingInterval)
            if (currentIndex < POLLING_INTERVALS.length - 1) {
              const newInterval = POLLING_INTERVALS[currentIndex + 1]
              setPollingInterval(newInterval)
            }
            setIsMoving(false)
          }
        } else {
          // First location update
          updateLocation(location)
          setLastLocation({ ...location, heading: 0 })
          await sendLocationUpdate(location, 0, 0, true)
        }
        
        setError(null)
      } catch (err) {
        setError('No se pudo obtener la ubicación')
      }
    }, pollingInterval)

    return intervalRef.current
  }, [pollingInterval, lastLocation, calculateDistance, calculateHeadingChange, sendLocationUpdate, updateLocation])

  // Handle page unload with sendBeacon
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (locationBuffer.current.length > 0) {
        // Send any buffered locations using sendBeacon
        const data = new Blob([JSON.stringify({
          locations: locationBuffer.current,
          timestamp: Date.now()
        })], { type: 'application/json' })
        
        navigator.sendBeacon('/api/location/batch', data)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Start/stop tracking
  useEffect(() => {
    if (isTracking) {
      const interval = startAdaptivePolling()
      return () => {
        if (interval) clearInterval(interval)
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isTracking, startAdaptivePolling])

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
            
            {/* Tracking Status */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Estado:</span>
                <div className="flex items-center space-x-1">
                  <Activity className={`h-3 w-3 ${isMoving ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={isMoving ? 'text-green-600' : 'text-gray-500'}>
                    {isMoving ? 'En movimiento' : 'Estacionario'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500">Intervalo:</span>
                <span className="text-gray-600">{pollingInterval / 1000}s</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500">Actualizaciones:</span>
                <span className="text-gray-600">{updateCount}</span>
              </div>
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
