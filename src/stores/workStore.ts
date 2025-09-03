'use client';
import { create } from 'zustand';
import { WorkLog, LocationData } from '@/types';

type Store = {
  currentWorkLog: WorkLog | null;
  currentLocation: LocationData | null;
  setCurrentWorkLog: (wl: WorkLog | null) => void;
  setCurrentLocation: (location: LocationData | null) => void;
  clockOut: () => void;
  clockIn: (projectId: string, location: LocationData) => void;
  // Derived getter - call this function, don't select it
  isClockedIn: () => boolean;
};

// ---- Singleton guard ----
const createWorkStore = () =>
  create<Store>()((set, get) => ({
    currentWorkLog: null,
    currentLocation: null,
    setCurrentWorkLog: (wl) => set({ currentWorkLog: wl }),
    setCurrentLocation: (location) => set({ currentLocation: location }),
    clockOut: () => set({ currentWorkLog: null, currentLocation: null }),
    clockIn: (projectId: string, location: LocationData) => {
      set({ currentLocation: location });
      // The actual worklog creation happens in the API
    },
    isClockedIn: () => {
      const currentWorkLog = get().currentWorkLog;
      return !!currentWorkLog && (currentWorkLog.clockOut === null || currentWorkLog.clockOut === undefined);
    },
  }));

// Reuse on the client, fresh per SSR request
const store = typeof window !== 'undefined'
  ? ((globalThis as any).__workStore ?? ((globalThis as any).__workStore = createWorkStore()))
  : createWorkStore();

// Add runtime trip-wire to detect duplication
// DEV: show instance once
if (process.env.NODE_ENV === 'development') {
  const id = Math.random().toString(36).slice(2, 8);
  // stamp & log once
  // @ts-expect-error debug
  (globalThis as any).__WORK_STORE_ID = id;
  console.log('[workStore] instance id =', id);
}

export const useWorkStore = store;
