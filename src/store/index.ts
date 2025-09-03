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
    clockOut,
    clockIn,
  }
}

// Simple in-memory project store
let currentProject: Project | null = null
let projects: Project[] = []

export const useProjectStore = () => {
  const setCurrentProject = (project: Project | null) => {
    currentProject = project
  }

  const setProjects = (projectList: Project[]) => {
    projects = projectList
  }

  return {
    currentProject,
    projects,
    setProjects,
    setCurrentProject,
  }
}

// Placeholder exports for compatibility
export const useAuthStore = () => ({})
