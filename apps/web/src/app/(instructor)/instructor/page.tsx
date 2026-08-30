import { AuthGuard } from "@/components/auth/auth-guard";
import { PortalShell } from "@/components/layout/portal-shell";
import { InstructorDashboard } from "@/features/instructor/instructor-dashboard";

export default function InstructorDashboardPage() {
  return (
    <AuthGuard allowedRoles={["INSTRUCTOR"]}>
      <PortalShell>
        <InstructorDashboard />
      </PortalShell>
    </AuthGuard>
  );
}
