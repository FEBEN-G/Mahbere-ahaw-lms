import type { UserRole } from "@/lib/auth/types";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  PenSquare,
  Settings,
} from "lucide-react";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
}

const studentNav: PortalNavItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { href: "/student/courses", label: "Courses", icon: BookOpen, match: "prefix" },
  {
    href: "/student/assignments",
    label: "Assignments",
    icon: ClipboardList,
    match: "exact",
  },
  {
    href: "/student/grades",
    label: "Grades",
    icon: GraduationCap,
    match: "exact",
  },
];

const instructorNav: PortalNavItem[] = [
  {
    href: "/instructor",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: "exact",
  },
  {
    href: "/instructor/grading",
    label: "Grade assignments",
    icon: PenSquare,
    match: "exact",
  },
];

const adminNav: PortalNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { href: "/admin/users", label: "Users", icon: Users, match: "exact" },
  { href: "/admin/courses", label: "Courses", icon: BookOpen, match: "exact" },
  {
    href: "/admin/assignments",
    label: "Assignments",
    icon: ClipboardList,
    match: "exact",
  },
  {
    href: "/admin/gradebook",
    label: "Gradebook",
    icon: FileSpreadsheet,
    match: "exact",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    match: "exact",
  },
];

export function navItemsForRole(role: UserRole): PortalNavItem[] {
  if (role === "STUDENT") return studentNav;
  if (role === "INSTRUCTOR") return instructorNav;
  return adminNav;
}

export function isNavItemActive(pathname: string, item: PortalNavItem): boolean {
  if (item.match === "prefix") {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
}

export function portalHomeForRole(role: UserRole): string {
  if (role === "STUDENT") return "/student";
  if (role === "INSTRUCTOR") return "/instructor";
  return "/admin";
}
