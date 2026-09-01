import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { AdminGradebookPanel } from "@/features/admin/gradebook-panel";

export default function AdminGradebookPage() {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <PortalShell>
        <PageHeader
          title="Gradebook"
          description="See all student scores and export them to Excel."
        />
        <AdminGradebookPanel />
      </PortalShell>
    </AuthGuard>
  );
}
