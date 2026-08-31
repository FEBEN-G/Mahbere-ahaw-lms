import type { ApiResponse } from "./client";
import { ApiError } from "./client";
import { refreshRequest } from "../auth/api";
import { getAuthState } from "../auth/store";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

let refreshPromise: Promise<string | null> | null = null;

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
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.success === false ? payload.error.message : "Request failed",
      payload.success === false ? payload.error.code : "REQUEST_FAILED",
      response.status,
    );
  }
  return payload.data;
}

export async function authenticatedUpload<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  const token = getAuthState().accessToken;
  if (!token) {
    throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
  }

  const send = async (accessToken: string) =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

  let response = await send(token);
  if (response.status === 401) {
    const nextToken = await refreshAccessToken();
    if (!nextToken) {
      window.location.href = "/login";
      throw new ApiError("Session expired", "UNAUTHORIZED", 401);
    }
    response = await send(nextToken);
  }

  return parseResponse<T>(response);
}

export async function authenticatedDownload(path: string, filename: string) {
  const blob = await authenticatedBlob(path);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export async function authenticatedBlob(path: string): Promise<Blob> {
  const token = getAuthState().accessToken;
  if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);

  const send = async (accessToken: string) =>
    fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

  let response = await send(token);
  if (response.status === 401) {
    const nextToken = await refreshAccessToken();
    if (!nextToken) {
      window.location.href = "/login";
      throw new ApiError("Session expired", "UNAUTHORIZED", 401);
    }
    response = await send(nextToken);
  }

  if (!response.ok) {
    throw new ApiError("Download failed", "REQUEST_FAILED", response.status);
  }

  return response.blob();
}
