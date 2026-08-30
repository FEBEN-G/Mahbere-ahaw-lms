import { authenticatedRequest } from "../api/authenticated-client";
import type { UserRole } from "../auth/types";

export interface InstructorProfileResponse {
  instructorProfileId: string;
  title: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  assignedCourses: Array<{
    id: string;
    title: string;
    monthNumber: number;
    status: string;
  }>;
  pendingSubmissionsCount: number;
  gradedThisWeekCount: number;
}

export function getInstructorMeRequest() {
  return authenticatedRequest<InstructorProfileResponse>("/instructors/me", {
    method: "GET",
  });
}
