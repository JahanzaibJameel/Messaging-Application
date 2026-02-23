/**
 * UI Store
 * Manages UI state including toasts, modals, and theme
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { UIState, UIActions, Toast } from './types';

type UIStore = UIState & UIActions;

const initialState: UIState = {
  toasts: [],
  isOnline: true,
  isSyncing: false,
  searchQuery: '',
  showSearch: false,
};

export const useUIStore = create<UIStore>()(
  immer((set, get) => ({
    ...initialState,

    showToast: (toast: Omit<Toast, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      set((state) => {
        state.toasts.push({ ...toast, id });
      });

      // Auto-hide toast after duration
      const duration = toast.duration || 3000;
      setTimeout(() => {
        get().hideToast(id);
      }, duration);

      return id;
    },

    hideToast: (toastId: string) => {
      set((state) => {
        state.toasts = state.toasts.filter((t: Toast) => t.id !== toastId);
      });
    },

    setOnline: (value: boolean) => {
      set((state) => {
        state.isOnline = value;
      });
    },

    setSyncing: (value: boolean) => {
      set((state) => {
        state.isSyncing = value;
      });
    },

    setSearchQuery: (query: string) => {
      set((state) => {
        state.searchQuery = query;
      });
    },

    setShowSearch: (value: boolean) => {
      set((state) => {
        state.showSearch = value;
      });
    },
  }))
);
