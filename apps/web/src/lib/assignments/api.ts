import { authenticatedRequest } from "../api/authenticated-client";
import { authenticatedUpload } from "../api/upload-client";

export interface AssignmentItem {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  maxScore: string | number;
  objectKey?: string | null;
  originalName?: string | null;
  course: { id: string; title: string; monthNumber: number };
  mySubmission?: {
    id: string;
    status: string;
    submittedAt: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  } | null;
}

export function listMyAssignmentsRequest() {
  return authenticatedRequest<AssignmentItem[]>("/assignments/my", {
    method: "GET",
  });
}

export function listCourseAssignmentsRequest(courseId: string) {
  return authenticatedRequest<AssignmentItem[]>(
    `/assignments/courses/${courseId}`,
    { method: "GET" },
  );
}

export function createAssignmentRequest(
  courseId: string,
  formData: FormData,
) {
  return authenticatedUpload(`/assignments/courses/${courseId}`, formData);
}

export function updateAssignmentRequest(id: string, formData: FormData) {
  return authenticatedUpload(`/assignments/${id}`, formData, "PATCH");
}

export function deleteAssignmentRequest(id: string) {
  return authenticatedRequest(`/assignments/${id}`, { method: "DELETE" });
}

export function getAssignmentRequest(id: string) {
  return authenticatedRequest(`/assignments/${id}`, { method: "GET" });
}
