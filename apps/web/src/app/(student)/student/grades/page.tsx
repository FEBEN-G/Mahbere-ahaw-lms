import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { StudentGradesPanel } from "@/features/student/grades-panel";

export default function StudentGradesPage() {
  return (
    <AuthGuard allowedRoles={["STUDENT"]}>
      <PortalShell>
        <PageHeader
          title="Grades"
          description="Scores and comments from your instructors."
        />
        <StudentGradesPanel />
      </PortalShell>
    </AuthGuard>
  );
}
