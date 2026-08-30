import { authenticatedRequest } from "../api/authenticated-client";

export function recordAttachmentProgressRequest(attachmentId: string) {
  return authenticatedRequest<{ ok: true }>(
    `/students/me/progress/attachments/${attachmentId}`,
    { method: "POST" },
  );
}
