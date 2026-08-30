import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { StudentAssignmentsPanel } from "@/features/student/assignments-panel";

export default function StudentAssignmentsPage() {
  return (
    <AuthGuard allowedRoles={["STUDENT"]}>
      <PortalShell>
        <PageHeader
          title="Assignments"
          description="Download prompts when available and upload your completed work."
        />
        <StudentAssignmentsPanel />
      </PortalShell>
    </AuthGuard>
  );
}
