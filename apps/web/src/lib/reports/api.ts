import { authenticatedRequest } from "../api/authenticated-client";
import { authenticatedDownload } from "../api/upload-client";

export interface ExportJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  error?: string | null;
  originalName?: string | null;
}

export function requestGradebookExport() {
  return authenticatedRequest<ExportJob>("/reports/gradebook/export", {
    method: "POST",
  });
}

export function getGradebookExportJob(jobId: string) {
  return authenticatedRequest<ExportJob>(`/reports/gradebook/exports/${jobId}`, {
    method: "GET",
  });
}

export function downloadGradebookExport(jobId: string, filename: string) {
  return authenticatedDownload(
    `/reports/gradebook/exports/${jobId}/download`,
    filename,
  );
}
