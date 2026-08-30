"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clearPortalRoleCookie,
  setPortalRoleCookie,
} from "./portal-role";
import type { AuthSession, AuthUser } from "./types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setSession: (session: AuthSession) => void;
  updateTokens: (accessToken: string, refreshToken: string, user?: AuthUser) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      setSession: (session) => {
        setPortalRoleCookie(session.user.role);
        set({
          user: session.user,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        });
      },
      updateTokens: (accessToken, refreshToken, user) => {
        const nextUser = user ?? get().user;
        if (nextUser) {
          setPortalRoleCookie(nextUser.role);
        }
        set({
          accessToken,
          refreshToken,
          user: nextUser,
        });
      },
      clearSession: () => {
        clearPortalRoleCookie();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
      },
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "lms-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.user?.role) {
          setPortalRoleCookie(state.user.role);
        }
        state?.setHydrated(true);
      },
    },
  ),
);

export function getAuthState() {
  return useAuthStore.getState();
}
