"use client";

import { useEffect, useRef } from "react";
import { ApiError } from "@/lib/api/client";
import { meRequest } from "@/lib/auth/api";
import { useAuthStore } from "@/lib/auth/store";

function isOfflineNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }
  return error instanceof ApiError && error.code === "NETWORK_ERROR";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const updateTokens = useAuthStore((state) => state.updateTokens);
  const clearSession = useAuthStore((state) => state.clearSession);
  const validatedRef = useRef(false);

  useEffect(() => {
    if (!isHydrated || validatedRef.current) return;
    validatedRef.current = true;

    if (!accessToken) return;

    // Keep an existing local session when the device is offline.
    if (typeof navigator !== "undefined" && !navigator.onLine && user) {
      return;
    }

    let cancelled = false;

    async function validateSession() {
      try {
        const nextUser = await meRequest(accessToken!);
        if (!cancelled) {
          updateTokens(accessToken!, refreshToken!, nextUser);
        }
      } catch (error) {
        if (isOfflineNetworkError(error) && user) {
          return;
        }

        if (!refreshToken || cancelled) {
          if (!(isOfflineNetworkError(error) && user)) {
            clearSession();
          }
          return;
        }

        try {
          const { refreshRequest } = await import("@/lib/auth/api");
          const session = await refreshRequest(refreshToken);
          if (!cancelled) {
            setSession(session);
          }
        } catch (refreshError) {
          if (cancelled) return;
          if (isOfflineNetworkError(refreshError) && user) {
            return;
          }
          clearSession();
        }
      }
    }

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, [
    isHydrated,
    accessToken,
    refreshToken,
    user,
    setSession,
    updateTokens,
    clearSession,
  ]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink/60">
        Loading session...
      </div>
    );
  }

  return children;
}
