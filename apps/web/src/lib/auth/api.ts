import { apiRequest } from "../api/client";
import type { AuthSession, AuthUser } from "./types";

export function loginRequest(email: string, password: string) {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function forgotPasswordRequest(email: string) {
  return apiRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPasswordRequest(token: string, newPassword: string) {
  return apiRequest<{ ok: true }>("/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

export function refreshRequest(refreshToken: string) {
  return apiRequest<AuthSession>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

export function meRequest(accessToken: string) {
  return apiRequest<AuthUser>("/auth/me", {
    method: "GET",
    accessToken,
  });
}

export function logoutRequest(
  accessToken: string,
  refreshToken?: string | null,
) {
  return apiRequest<{ ok: true }>("/auth/logout", {
    method: "POST",
    accessToken,
    body: refreshToken ? { refreshToken } : {},
  });
}
