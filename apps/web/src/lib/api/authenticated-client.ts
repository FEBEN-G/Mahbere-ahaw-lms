import { ApiError, apiRequest, apiRequestWithMeta } from "./client";
import { refreshRequest } from "../auth/api";
import { getAuthState } from "../auth/store";

interface AuthenticatedRequestOptions {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
}

let refreshPromise: Promise<string | null> | null = null;

function shouldPreserveOfflineSession(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return Boolean(getAuthState().user);
  }
  return (
    error instanceof ApiError &&
    error.code === "NETWORK_ERROR" &&
    Boolean(getAuthState().user)
  );
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, clearSession } = getAuthState();
  if (!refreshToken) {
    clearSession();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshRequest(refreshToken)
      .then((session) => {
        setSession(session);
        return session.accessToken;
      })
      .catch((error: unknown) => {
        if (!shouldPreserveOfflineSession(error)) {
          clearSession();
        }
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function withAuthRetry<T>(
  run: (accessToken: string) => Promise<T>,
): Promise<T> {
  const { accessToken } = getAuthState();
  if (!accessToken) {
    throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
  }

  try {
    return await run(accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    const nextToken = await refreshAccessToken();
    if (!nextToken) {
      if (
        typeof window !== "undefined" &&
        !shouldPreserveOfflineSession(error) &&
        navigator.onLine
      ) {
        window.location.href = "/login";
      }
      throw error;
    }

    return run(nextToken);
  }
}

export async function authenticatedRequest<T>(
  path: string,
  options: AuthenticatedRequestOptions = {},
): Promise<T> {
  return withAuthRetry((accessToken) =>
    apiRequest<T>(path, {
      method: options.method,
      body: options.body,
      headers: options.headers,
      accessToken,
    }),
  );
}

export async function authenticatedRequestWithMeta<T>(
  path: string,
  options: AuthenticatedRequestOptions = {},
): Promise<{ data: T; meta: Record<string, unknown> | null }> {
  return withAuthRetry((accessToken) =>
    apiRequestWithMeta<T>(path, {
      method: options.method,
      body: options.body,
      headers: options.headers,
      accessToken,
    }),
  );
}
