import { create } from 'zustand'
import { User, WorkLog, Project, LocationData } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

interface WorkLogState {
  currentWorkLog: WorkLog | null
  currentLocation: LocationData | null
  clockIn: (projectId: string, location: LocationData) => void
  clockOut: () => void
  updateLocation: (location: LocationData) => void
  setCurrentWorkLog: (workLog: WorkLog) => void
  get isClockedIn(): boolean
}

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}))

export const useWorkLogStore = create<WorkLogState>((set, get) => ({
  currentWorkLog: null,
  currentLocation: null,
  clockIn: (projectId, location) => set({
    currentLocation: location,
    currentWorkLog: {
      id: '',
      userId: '',
      projectId,
      clockIn: new Date(),
      tasksCompleted: '[]',
      materialsUsed: '[]',
      photos: [],
      approved: false,
      createdAt: new Date(),
    } as WorkLog,
  }),
  clockOut: () => set({
    currentWorkLog: null,
    currentLocation: null,
  }),
  updateLocation: (location) => set({ currentLocation: location }),
  setCurrentWorkLog: (workLog) => {
    console.log('🔄 Store: setCurrentWorkLog called with:', workLog)
    set({ currentWorkLog: workLog })
    console.log('🔄 Store: currentWorkLog updated, new state:', get().currentWorkLog)
    console.log('🔄 Store: isClockedIn should now be:', get().isClockedIn)
  },
  get isClockedIn() {
    const result = get().currentWorkLog !== null && (get().currentWorkLog.clockOut === null || get().currentWorkLog.clockOut === undefined)
    console.log('Store isClockedIn getter:', result, 'currentWorkLog:', get().currentWorkLog)
    return result
  },
}))

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
}))
