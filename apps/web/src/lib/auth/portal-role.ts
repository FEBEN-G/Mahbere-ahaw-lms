import type { UserRole } from "@/lib/auth/types";

export const PORTAL_ROLE_COOKIE = "lms-portal-role";

const VALID_ROLES = new Set<UserRole>([
  "SUPER_ADMIN",
  "INSTRUCTOR",
  "STUDENT",
]);

export function isUserRole(value: string | undefined | null): value is UserRole {
  return Boolean(value && VALID_ROLES.has(value as UserRole));
}

export function setPortalRoleCookie(role: UserRole) {
  if (typeof document === "undefined") return;
  document.cookie = `${PORTAL_ROLE_COOKIE}=${role}; Path=/; SameSite=Lax; Max-Age=2592000`;
}

export function clearPortalRoleCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${PORTAL_ROLE_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}
