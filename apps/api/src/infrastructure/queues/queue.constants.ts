export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  EXPORTS: 'exports',
  CONTENT_RELEASE: 'content-release',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface DeliverNotificationJob {
  notificationId: string;
}

export interface ExportGradebookJob {
  exportJobId: string;
}

export interface ContentReleaseJob {
  enrollmentId: string;
  studentUserId: string;
  monthNumber: number;
}

export type ContentReleaseScanJob = Record<string, never>;

