import { authenticatedRequest } from "../api/authenticated-client";
import { authenticatedDownload, authenticatedUpload } from "../api/upload-client";

export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  monthNumber: number;
  status: string;
  _count?: { modules: number; assignments: number };
}

export interface Attachment {
  id: string;
  title: string;
  type: string;
  externalUrl: string | null;
  objectKey: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export interface CourseInstructorAssignment {
  id: string;
  instructor: {
    id: string;
    title: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  attachments: Attachment[];
}

export interface CourseDetail extends CourseSummary {
  modules: CourseModule[];
  assignments: Array<{
    id: string;
    title: string;
    dueAt: string;
    objectKey?: string | null;
    originalName?: string | null;
  }>;
  instructors?: CourseInstructorAssignment[];
}

export async function listCoursesRequest(params?: {
  page?: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("pageSize", String(params?.pageSize ?? 100));
  const data = await authenticatedRequest<
    CourseSummary[] | { items: CourseSummary[] }
  >(`/courses?${search.toString()}`, { method: "GET" });
  // ResponseInterceptor usually unwraps items; keep fallback for safety
  return Array.isArray(data) ? data : data.items;
}


export function getCourseRequest(id: string) {
  return authenticatedRequest<CourseDetail>(`/courses/${id}`, { method: "GET" });
}

export function createCourseRequest(body: {
  title: string;
  description?: string;
  monthNumber: number;
}) {
  return authenticatedRequest<CourseSummary>("/courses", {
    method: "POST",
    body,
  });
}

export function publishCourseRequest(id: string) {
  return authenticatedRequest(`/courses/${id}/publish`, { method: "POST" });
}

export function unpublishCourseRequest(id: string) {
  return authenticatedRequest(`/courses/${id}/unpublish`, { method: "POST" });
}

export function deleteCourseRequest(id: string) {
  return authenticatedRequest(`/courses/${id}`, { method: "DELETE" });
}

export function createModuleRequest(
  courseId: string,
  body: { title: string; description?: string },
) {
  return authenticatedRequest(`/courses/${courseId}/modules`, {
    method: "POST",
    body,
  });
}

export function addVideoLinkRequest(
  moduleId: string,
  body: { title: string; externalUrl: string },
) {
  return authenticatedRequest(`/courses/modules/${moduleId}/attachments/video`, {
    method: "POST",
    body,
  });
}

export function uploadModuleFileRequest(moduleId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return authenticatedUpload(`/courses/modules/${moduleId}/attachments/file`, formData);
}

export function assignInstructorRequest(
  courseId: string,
  instructorProfileId: string,
) {
  return authenticatedRequest(`/courses/${courseId}/instructors`, {
    method: "POST",
    body: { instructorProfileId },
  });
}

export function downloadCourseAttachmentRequest(
  attachmentId: string,
  filename: string,
) {
  return authenticatedDownload(
    `/courses/attachments/${attachmentId}/download`,
    filename,
  );
}
