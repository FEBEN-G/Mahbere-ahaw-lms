import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { InstructorGradingPanel } from "@/features/instructor/grading-panel";

export default function InstructorGradingPage() {
  return (
    <AuthGuard allowedRoles={["INSTRUCTOR"]}>
      <PortalShell>
        <PageHeader
          title="Assignment review"
          description="Filter submissions by course, assignment, or status. Download student work, enter a numerical score, and write detailed feedback before publishing."
        />
        <InstructorGradingPanel />
      </PortalShell>
    </AuthGuard>
  );
}
