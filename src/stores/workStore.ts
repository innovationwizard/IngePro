'use client';

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

type WorkLog = {
  id: string;
  personId: string;
  projectId: string;
  clockIn: string;   // ISO string
  clockOut: string | null; // ISO or null
  tasksCompleted?: string;
  materialsUsed?: string;
  photos?: string[];
  approved?: boolean;
  createdAt?: string;
  updatedAt?: string;
} | null;

type WorkState = {
  currentWorkLog: WorkLog;
  setCurrentWorkLog: (wl: WorkLog) => void;
};

// build store
const makeStore = () =>
  createStore<WorkState>()((set) => ({
    currentWorkLog: null,
    setCurrentWorkLog: (wl) => set({ currentWorkLog: wl }),
  }));

// singleton across HMR
const KEY = Symbol.for('app.workStore');
const g = globalThis as any;
if (!g[KEY]) g[KEY] = makeStore();
export const workStore = g[KEY];

// Set the store ID for debugging
(globalThis as any).__WORK_STORE_ID = KEY.description || 'app.workStore';

// hook
export const useWorkStore = <T,>(selector: (s: WorkState) => T) =>
  useStore(workStore, selector);