import { authenticatedRequest } from "../api/authenticated-client";
import type { UserRole } from "../auth/types";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  unlockedMonth?: number | null;
  studentProfile?: {
    id: string;
    studentCode: string | null;
    enrollment?: {
      cohortStartedAt: string;
      isActive: boolean;
    } | null;
  } | null;
  instructorProfile?: {
    id: string;
    title: string | null;
  } | null;
}

export interface CreateStudentPayload {
  email: string;
  firstName: string;
  lastName: string;
  studentCode?: string;
  cohortStartedAt?: string;
}

export interface CreateInstructorPayload {
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
}

export interface StudentEnrollmentResponse {
  studentProfileId: string;
  studentCode: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  enrollment: {
    id: string;
    cohortStartedAt: string;
    isActive: boolean;
    unlockedMonth: number;
    currentMonthCourseSlotHint: number;
  };
}

export function listUsersRequest(params?: {
  page?: number;
  pageSize?: number;
  role?: UserRole;
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.pageSize) search.set("pageSize", String(params.pageSize));
  if (params?.role) search.set("role", params.role);
  const query = search.toString();

  return authenticatedRequest<{
    items: AdminUser[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>(`/users${query ? `?${query}` : ""}`, {
    method: "GET",
  }).then((result) => result.items);
}

export function createStudentRequest(payload: CreateStudentPayload) {
  return authenticatedRequest<{
    user: AdminUser;
    enrollment: { cohortStartedAt: string; unlockedMonth: number };
    temporaryPassword: string;
  }>("/users/students", {
    method: "POST",
    body: payload,
  });
}

export function createInstructorRequest(payload: CreateInstructorPayload) {
  return authenticatedRequest<{
    user: AdminUser;
    temporaryPassword: string;
  }>("/users/instructors", {
    method: "POST",
    body: payload,
  });
}

export function getMyEnrollmentRequest() {
  return authenticatedRequest<StudentEnrollmentResponse>("/students/me", {
    method: "GET",
  });
}

export function setUserActiveRequest(id: string, isActive: boolean) {
  return authenticatedRequest<AdminUser>(`/users/${id}/active`, {
    method: "PATCH",
    body: { isActive },
  });
}

export function deleteUserRequest(id: string) {
  return authenticatedRequest<AdminUser>(`/users/${id}`, {
    method: "DELETE",
  });
}
