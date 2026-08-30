import { authenticatedRequest } from "../api/authenticated-client";
import { authenticatedUpload, authenticatedDownload } from "../api/upload-client";

export interface SubmissionItem {
  id: string;
  status: string;
  submittedAt: string;
  originalName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  assignment?: {
    id: string;
    title: string;
    maxScore?: string | number | null;
    dueAt?: string;
    course: { id?: string; title: string; monthNumber?: number };
  };
  student?: {
    user: { firstName: string; lastName: string; email: string };
  };
  grade?: {
    id: string;
    score: string | number;
    feedback: string | null;
    status: string;
  } | null;
}

export function submitAssignmentRequest(assignmentId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return authenticatedUpload(`/submissions/assignments/${assignmentId}`, formData);
}

export function listSubmissionsForAssignmentRequest(assignmentId: string) {
  return authenticatedRequest<SubmissionItem[]>(
    `/submissions/assignments/${assignmentId}`,
    { method: "GET" },
  );
}

export function listMySubmissionsRequest() {
  return authenticatedRequest<SubmissionItem[]>("/submissions/my", {
    method: "GET",
  });
}

export function downloadSubmissionRequest(id: string, filename: string) {
  return authenticatedDownload(`/submissions/${id}/download`, filename);
}
