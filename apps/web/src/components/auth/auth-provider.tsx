"use client";

import { useEffect, useRef, useState } from "react";
import { BrandSplashLoader } from "@/components/brand/brand-splash-loader";
import { ApiError } from "@/lib/api/client";
import { meRequest } from "@/lib/auth/api";
import { useAuthStore } from "@/lib/auth/store";

const MIN_SPLASH_MS = 900;

function isOfflineNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }
  return error instanceof ApiError && error.code === "NETWORK_ERROR";
}

function waitForMinimumSplash(startedAt: number) {
  const remaining = MIN_SPLASH_MS - (Date.now() - startedAt);
  if (remaining <= 0) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const updateTokens = useAuthStore((state) => state.updateTokens);
  const clearSession = useAuthStore((state) => state.clearSession);

  const splashStartedRef = useRef(Date.now());
  const validatedRef = useRef(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    let cancelled = false;

    async function finishBootstrap() {
      await waitForMinimumSplash(splashStartedRef.current);
      if (cancelled) return;
      setIsExiting(true);
      window.setTimeout(() => {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }, 380);
    }

    async function bootstrap() {
      if (!accessToken) {
        await finishBootstrap();
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine && user) {
        await finishBootstrap();
        return;
      }

      if (validatedRef.current) {
        await finishBootstrap();
        return;
      }
      validatedRef.current = true;

      try {
        const nextUser = await meRequest(accessToken);
        if (!cancelled) {
          updateTokens(accessToken, refreshToken!, nextUser);
        }
      } catch (error) {
        if (isOfflineNetworkError(error) && user) {
          await finishBootstrap();
          return;
        }

        if (!refreshToken || cancelled) {
          if (!(isOfflineNetworkError(error) && user)) {
            clearSession();
          }
          await finishBootstrap();
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
            await finishBootstrap();
            return;
          }
          clearSession();
        }
      }

      await finishBootstrap();
    }

    void bootstrap();

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

  if (!isHydrated || bootstrapping) {
    return (
      <BrandSplashLoader
        className={isExiting ? "animate-splash-exit" : undefined}
      />
    );
  }

  return children;
}
