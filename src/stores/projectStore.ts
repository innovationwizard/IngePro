'use client';

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

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

type ProjectState = {
  currentProject: Project;
  projects: Project[];
  setCurrentProject: (project: Project) => void;
  setProjects: (projects: Project[]) => void;
};

// build store
const makeProjectStore = () =>
  createStore<ProjectState>()((set) => ({
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

// singleton across HMR
const KEY = Symbol.for('app.projectStore');
const g = globalThis as any;
if (!g[KEY]) g[KEY] = makeProjectStore();
export const projectStore = g[KEY];

// Set the store ID for debugging
(globalThis as any).__PROJECT_STORE_ID = KEY.description || 'app.projectStore';

// hook
export const useProjectStore = <T,>(selector: (s: ProjectState) => T) =>
  useStore(projectStore, selector);
