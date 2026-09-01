import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { AdminCoursesPanel } from "@/features/admin/courses-panel";

export default function AdminCoursesPage() {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <PortalShell>
        <PageHeader
          title="Courses"
          description="Create monthly courses, add reading materials, and make them live for students."
        />
        <AdminCoursesPanel />
      </PortalShell>
    </AuthGuard>
  );
}
