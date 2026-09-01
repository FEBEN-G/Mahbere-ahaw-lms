import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { InstructorGradingPanel } from "@/features/instructor/grading-panel";

export default function InstructorGradingPage() {
  return (
    <AuthGuard allowedRoles={["INSTRUCTOR"]}>
      <PortalShell>
        <PageHeader
          title="Grade assignments"
          description="Pick a course and assignment, download student work, enter a score, and share feedback."
        />
        <InstructorGradingPanel />
      </PortalShell>
    </AuthGuard>
  );
}
