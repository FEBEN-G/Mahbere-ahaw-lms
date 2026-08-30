import type { UserRole } from "./types";

export function dashboardPathForRole(role: UserRole): string {
  if (role === "STUDENT") return "/student";
  if (role === "INSTRUCTOR") return "/instructor";
  return "/admin";
}

export function roleLabel(role: UserRole): string {
  if (role === "STUDENT") return "Student";
  if (role === "INSTRUCTOR") return "Instructor";
  return "Super Admin";
}
