import {
  authenticatedRequest,
  authenticatedRequestWithMeta,
} from "../api/authenticated-client";

export interface GradeItem {
  id: string;
  score: string | number;
  feedback: string | null;
  status: string;
  publishedAt: string | null;
  submission: {
    assignment: {
      title: string;
      maxScore?: string | number | null;
      course: { title: string; monthNumber: number };
    };
  };
}

export function listMyGradesRequest() {
  return authenticatedRequest<GradeItem[]>("/grading/my", { method: "GET" });
}

export function gradeSubmissionRequest(
  submissionId: string,
  body: { score: number; feedback?: string },
) {
  return authenticatedRequest(`/grading/submissions/${submissionId}`, {
    method: "POST",
    body,
  });
}

export function publishGradeRequest(gradeId: string) {
  return authenticatedRequest(`/grading/grades/${gradeId}/publish`, {
    method: "PATCH",
  });
}

export interface GradebookMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function listGradebookRequest(page = 1, pageSize = 25) {
  const result = await authenticatedRequestWithMeta<GradebookRow[]>(
    `/grading/gradebook?page=${page}&pageSize=${pageSize}`,
    { method: "GET" },
  );

  const meta = result.meta as Partial<GradebookMeta> | null;
  return {
    items: result.data,
    meta: {
      page: Number(meta?.page ?? page),
      pageSize: Number(meta?.pageSize ?? pageSize),
      total: Number(meta?.total ?? result.data.length),
      totalPages: Number(meta?.totalPages ?? 1),
    },
  };
}

export interface GradebookRow {
  id: string;
  score: string | number;
  status: string;
  submission: {
    assignment: {
      title: string;
      course: { title: string; monthNumber?: number };
    };
    student: {
      user: { firstName: string; lastName: string };
    };
  };
}
