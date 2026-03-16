'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useLibraryStore } from './library-store';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: string;
  profile: {
    displayName: string;
    bio: string | null;
    country: string | null;
  } | null;
}

interface SessionStore {
  accessToken: string | null;
  user: SessionUser | null;
  setSession: (payload: { accessToken: string; user: SessionUser }) => void;
  setUser: (user: SessionUser) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: ({ accessToken, user }) => set({ accessToken, user }),
      setUser: (user) => set((state) => ({ accessToken: state.accessToken, user })),
      clearSession: () => {
        useLibraryStore.getState().clearOverview();
        set({ accessToken: null, user: null });
      },
    }),
    {
      name: 'freevibes-session',
    },
  ),
);
