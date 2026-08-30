import { AuthGuard } from "@/components/auth/auth-guard";
import { PortalShell } from "@/components/layout/portal-shell";
import { StudentCourseDetail } from "@/features/student/course-detail";

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <AuthGuard allowedRoles={["STUDENT"]}>
      <PortalShell>
        <StudentCourseDetail courseId={courseId} />
      </PortalShell>
    </AuthGuard>
  );
}
