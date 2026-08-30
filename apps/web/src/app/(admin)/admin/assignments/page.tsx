import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { AdminAssignmentsPanel } from "@/features/admin/assignments-panel";

export default function AdminAssignmentsPage() {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <PortalShell>
        <PageHeader
          title="Assignments"
          description="Create assignment prompts with due dates for published courses."
        />
        <AdminAssignmentsPanel />
      </PortalShell>
    </AuthGuard>
  );
}
