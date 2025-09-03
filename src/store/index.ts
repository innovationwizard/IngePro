import { User, WorkLog, Project, LocationData } from '@/types'

// Simple in-memory store for debugging
let currentWorkLog: WorkLog | null = null
let currentLocation: LocationData | null = null

export const useWorkLogStore = () => {
  const setCurrentWorkLog = (workLog: WorkLog) => {
    console.log('🔄 Store: setCurrentWorkLog called with:', workLog)
    currentWorkLog = workLog
    console.log('🔄 Store: currentWorkLog updated, new state:', currentWorkLog)
  }

  const getCurrentWorkLog = () => currentWorkLog

  const getIsClockedIn = () => {
    const clockOut = currentWorkLog?.clockOut
    const result = currentWorkLog !== null && (clockOut === null || clockOut === undefined)
    
    console.log('🔍 Store isClockedIn getter debug:')
    console.log('  - currentWorkLog:', currentWorkLog)
    console.log('  - clockOut:', clockOut)
    console.log('  - currentWorkLog !== null:', currentWorkLog !== null)
    console.log('  - clockOut === null:', clockOut === null)
    console.log('  - clockOut === undefined:', clockOut === undefined)
    console.log('  - Final result:', result)
    
    return result
  }

  const clockOut = () => {
    console.log('🔄 Store: clockOut called')
    currentWorkLog = null
    currentLocation = null
  }

  const clockIn = (projectId: string, location: LocationData) => {
    console.log('🔄 Store: clockIn called with projectId:', projectId)
    currentLocation = location
    // This is just a placeholder - the real worklog comes from the API
  }

  return {
    currentWorkLog,
    currentLocation,
    setCurrentWorkLog,
    getCurrentWorkLog,
    getIsClockedIn,
    clockOut,
    clockIn,
  }
}

// Placeholder exports for compatibility
export const useAuthStore = () => ({})
export const useProjectStore = () => ({
  currentProject: null,
  projects: [],
  setProjects: () => {},
  setCurrentProject: () => {},
})
