import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { StudentCoursesList } from "@/features/student/courses-list";

export default function StudentCoursesPage() {
  return (
    <AuthGuard allowedRoles={["STUDENT"]}>
      <PortalShell>
        <PageHeader
          title="Your courses"
          description="Courses for months you can access — read online or download for offline."
        />
        <StudentCoursesList />
      </PortalShell>
    </AuthGuard>
  );
}
