import { AuthGuard } from "@/components/auth/auth-guard";
import { PortalShell } from "@/components/layout/portal-shell";
import { AdminDripOverview } from "@/features/admin/drip-overview";
import { AdminStats } from "@/features/admin/admin-stats";

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <PortalShell>
        <div className="space-y-6">
          <AdminStats />
          <AdminDripOverview />
        </div>
      </PortalShell>
    </AuthGuard>
  );
}
