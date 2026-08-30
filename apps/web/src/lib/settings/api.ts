import { authenticatedRequest } from "@/lib/api/authenticated-client";
import type { UserRole } from "@/lib/auth/types";

export interface SystemSettings {
  id: string;
  dripDaysPerMonth: number;
  publishedCoursesPerMonth: number;
  maxUploadMb: number;
  createdAt: string;
  updatedAt: string;
  updatedById: string | null;
}

export interface AccessLevel {
  role: UserRole;
  permissions: string[];
}

export function getSystemSettingsRequest() {
  return authenticatedRequest<SystemSettings>("/settings");
}

export function getAccessLevelsRequest() {
  return authenticatedRequest<AccessLevel[]>("/settings/access-levels");
}

export function updateSystemSettingsRequest(input: {
  dripDaysPerMonth: number;
  publishedCoursesPerMonth: number;
  maxUploadMb: number;
}) {
  return authenticatedRequest<SystemSettings>("/settings", {
    method: "PATCH",
    body: input,
  });
}
