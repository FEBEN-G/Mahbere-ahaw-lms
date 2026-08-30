import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { PortalShell } from "@/components/layout/portal-shell";
import { CreateUserForms } from "@/features/admin/create-user-forms";
import { UsersTable } from "@/features/admin/users-table";

export default function AdminUsersPage() {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <PortalShell>
        <PageHeader
          title="Users"
          description="Register students and instructors, then manage account access."
        />
        <div className="space-y-6">
          <CreateUserForms />
          <UsersTable />
        </div>
      </PortalShell>
    </AuthGuard>
  );
}
