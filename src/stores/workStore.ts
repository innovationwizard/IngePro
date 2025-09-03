'use client';

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

type WorkLog = { 
  id: string;
  personId: string;
  projectId: string;
  clockIn: Date;
  clockOut: Date | null;
  location: any;
  tasksCompleted: string;
  materialsUsed: string;
  photos: string[];
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
} | null;

type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
} | null;

type WorkState = {
  currentWorkLog: WorkLog;
  currentLocation: LocationData;
  setCurrentWorkLog: (wl: WorkLog) => void;
  setCurrentLocation: (loc: LocationData) => void;
  clockOut: () => void;
};

// build the store
const makeStore = () =>
  createStore<WorkState>()((set) => ({
    currentWorkLog: null,
    currentLocation: null,
    setCurrentWorkLog: (wl) => set({ currentWorkLog: wl }),
    setCurrentLocation: (loc) => set({ currentLocation: loc }),
    clockOut: () => set({ currentWorkLog: null, currentLocation: null }),
  }));

// global singleton (client HMR-safe)
const KEY = Symbol.for('app.workStore');
const g = globalThis as any;
if (!g[KEY]) g[KEY] = makeStore();
export const workStore = g[KEY];

// hook bound to the singleton
export const useWorkStore = <T>(selector: (s: WorkState) => T) =>
  useStore(workStore, selector);

// DEV: show instance once
if (process.env.NODE_ENV === 'development') {
  console.log('[workStore] instance id =', g[KEY] === workStore && KEY.toString());
}