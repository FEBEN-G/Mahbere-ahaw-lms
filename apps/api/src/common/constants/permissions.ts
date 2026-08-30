import { Permission, Role } from '@prisma/client';

export const PERMISSIONS = Permission;

export const ROLE_PERMISSION_MAP: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  INSTRUCTOR: [
    Permission.COURSE_READ,
    Permission.SUBMISSION_READ,
    Permission.GRADE_CREATE,
    Permission.GRADE_READ,
    Permission.GRADE_PUBLISH,
    Permission.NOTIFICATION_READ,
    Permission.DASHBOARD_INSTRUCTOR,
  ],
  STUDENT: [
    Permission.COURSE_READ,
    Permission.SUBMISSION_CREATE,
    Permission.SUBMISSION_UPDATE,
    Permission.GRADE_READ,
    Permission.NOTIFICATION_READ,
    Permission.DASHBOARD_STUDENT,
  ],
};
