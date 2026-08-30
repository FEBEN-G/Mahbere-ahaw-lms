import { authenticatedRequest } from "../api/authenticated-client";

export interface AdminDashboardSummary {
  students: number;
  instructors: number;
  publishedCourses: number;
  pendingSubmissions: number;
  gradedCount: number;
}

export interface DailyMetricPoint {
  date: string;
  count: number;
}

export interface AdminMetrics {
  generatedAt: string;
  windowDays: number;
  summary: AdminDashboardSummary & { gradedThisWeek: number };
  submissionPipeline: {
    submitted: number;
    late: number;
    graded: number;
    returned: number;
  };
  coursesByMonth: Array<{
    monthNumber: number;
    published: number;
    draft: number;
    total: number;
  }>;
  series: {
    submissions: DailyMetricPoint[];
    publishedGrades: DailyMetricPoint[];
    enrollments: DailyMetricPoint[];
  };
}

export function getAdminDashboardRequest() {
  return authenticatedRequest<AdminDashboardSummary>("/dashboard/admin", {
    method: "GET",
  });
}

export function getAdminMetricsRequest(days = 14) {
  return authenticatedRequest<AdminMetrics>(
    `/dashboard/admin/metrics?days=${days}`,
    { method: "GET" },
  );
}

export function getStudentDashboardRequest() {
  return authenticatedRequest<{
    unlockedMonth: number;
    currentMonthCourses: Array<{
      id: string;
      title: string;
      description: string | null;
      monthNumber: number;
      moduleCount: number;
      assignmentCount: number;
    }>;
    progress: {
      completed: number;
      total: number;
      percent: number;
    };
    availableCourses: number;
    submissionsCount: number;
    publishedGradesCount: number;
  }>("/dashboard/student", { method: "GET" });
}

export function getInstructorDashboardRequest() {
  return authenticatedRequest<{
    assignedCourses: number;
    pendingSubmissions: number;
    gradedThisWeekCount: number;
  }>("/dashboard/instructor", { method: "GET" });
}
