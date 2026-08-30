import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { SystemSettingsPanel } from "@/features/admin/system-settings-panel";

export default function AdminSettingsPage() {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <PortalShell>
        <PageHeader
          title="Settings"
          description="Configure program workflow and review Super Admin, Instructor, and Student access levels."
        />
        <SystemSettingsPanel />
      </PortalShell>
    </AuthGuard>
  );
}
