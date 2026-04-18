import { create } from 'zustand';
import type { ScanRecord } from '../types';

interface HistoryState {
  /** Cached scan records (loaded from SQLite) */
  scans: ScanRecord[];
  /** Whether the history is currently loading */
  isLoading: boolean;

  // Actions
  setScans: (scans: ScanRecord[]) => void;
  addScan: (scan: ScanRecord) => void;
  removeScan: (id: number) => void;
  setIsLoading: (loading: boolean) => void;
  clearAll: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  scans: [],
  isLoading: false,

  setScans: (scans) => set({ scans }),

  addScan: (scan) =>
    set((state) => ({ scans: [scan, ...state.scans] })),

  removeScan: (id) =>
    set((state) => ({
      scans: state.scans.filter((s) => s.id !== id),
    })),

  setIsLoading: (loading) => set({ isLoading: loading }),

  clearAll: () => set({ scans: [] }),
}));
