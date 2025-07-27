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
  isClockedIn: boolean
  currentLocation: LocationData | null
  clockIn: (projectId: string, location: LocationData) => void
  clockOut: () => void
  updateLocation: (location: LocationData) => void
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

export const useWorkLogStore = create<WorkLogState>((set) => ({
  currentWorkLog: null,
  isClockedIn: false,
  currentLocation: null,
  clockIn: (projectId, location) => set({
    isClockedIn: true,
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
    isClockedIn: false,
    currentWorkLog: null,
  }),
  updateLocation: (location) => set({ currentLocation: location }),
}))

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
}))
