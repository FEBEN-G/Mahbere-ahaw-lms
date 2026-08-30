import { AuthGuard } from "@/components/auth/auth-guard";
import { PortalShell } from "@/components/layout/portal-shell";
import { StudentDashboard } from "@/features/student/student-dashboard";

export default function StudentDashboardPage() {
  return (
    <AuthGuard allowedRoles={["STUDENT"]}>
      <PortalShell>
        <StudentDashboard />
      </PortalShell>
    </AuthGuard>
  );
}
