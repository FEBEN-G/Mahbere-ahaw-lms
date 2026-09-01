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
          description="Set when new months open and review what each role can do."
        />
        <SystemSettingsPanel />
      </PortalShell>
    </AuthGuard>
  );
}
