import { authenticatedRequest } from "../api/authenticated-client";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  eventType: string;
  readAt: string | null;
  createdAt: string;
}

export function listNotificationsRequest() {
  return authenticatedRequest<NotificationItem[]>("/notifications", {
    method: "GET",
  });
}

export function markNotificationReadRequest(id: string) {
  return authenticatedRequest(`/notifications/${id}/read`, { method: "PATCH" });
}
