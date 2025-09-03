// app/stores/projectStore.ts
'use client';
import { create } from 'zustand';

type Project = {
  id: string;
  name: string;
  description: string;
  company: {
    id: string;
    name: string;
  };
  createdAt: string;
} | null;

type Store = {
  currentProject: Project;
  projects: Project[];
  setCurrentProject: (project: Project) => void;
  setProjects: (projects: Project[]) => void;
  __instanceId?: string; // For debugging singleton
};

// ---- Singleton guard ----
const createProjectStore = () =>
  create<Store>()((set, get) => ({
    currentProject: null,
    projects: [],
    setCurrentProject: (project) => {
      console.log('🔄 ProjectStore: setCurrentProject called with:', project);
      set({ currentProject: project });
    },
    setProjects: (projects) => {
      console.log('🔄 ProjectStore: setProjects called with:', projects.length, 'projects');
      set({ projects });
    },
  }));

// Reuse on the client, fresh per SSR request
const store = typeof window !== 'undefined'
  ? ((globalThis as any).__projectStore ?? ((globalThis as any).__projectStore = createProjectStore()))
  : createProjectStore();

// Add a runtime trip-wire (proves duplication)
if (process.env.NODE_ENV === 'development') {
  const id = Math.random().toString(36).slice(2,7);
  // stamp the instance so you can see if multiple appear
  store.setState(s => Object.assign(s, { __instanceId: id }) as any, true);
  console.log('[projectStore] instance id =', id);
}

export const useProjectStore = store;
