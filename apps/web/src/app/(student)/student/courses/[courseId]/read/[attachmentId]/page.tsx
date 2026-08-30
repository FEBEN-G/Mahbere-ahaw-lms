"use client";

import { use } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PortalShell } from "@/components/layout/portal-shell";
import { ModuleReader } from "@/features/student/module-reader";

export default function StudentModuleReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; attachmentId: string }>;
  searchParams: Promise<{ title?: string; type?: string }>;
}) {
  const { courseId, attachmentId } = use(params);
  const { title, type } = use(searchParams);

  return (
    <AuthGuard allowedRoles={["STUDENT"]}>
      <PortalShell>
        <ModuleReader
          courseId={courseId}
          attachmentId={attachmentId}
          title={title ?? "Reading material"}
          type={type}
        />
      </PortalShell>
    </AuthGuard>
  );
}
