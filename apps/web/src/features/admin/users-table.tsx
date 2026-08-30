"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteUserRequest,
  listUsersRequest,
  setUserActiveRequest,
} from "@/lib/users/api";

export function UsersTable() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsersRequest({ pageSize: 50 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setUserActiveRequest(id, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUserRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  if (usersQuery.isLoading) {
    return <p className="text-sm text-ink/60">Loading users...</p>;
  }

  if (usersQuery.isError) {
    return (
      <p className="text-sm text-accent">
        {(usersQuery.error as Error).message}
      </p>
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white/80">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line bg-sand/70 text-ink/70">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Unlocked month</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-line/70 last:border-0">
              <td className="px-4 py-3">
                {user.firstName} {user.lastName}
              </td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">{user.role}</td>
              <td className="px-4 py-3">{user.unlockedMonth ?? "—"}</td>
              <td className="px-4 py-3">
                {user.isActive ? "Active" : "Inactive"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({
                        id: user.id,
                        isActive: !user.isActive,
                      })
                    }
                    className="rounded-md border border-line px-2 py-1 text-xs font-medium hover:bg-sand disabled:opacity-60"
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove ${user.firstName} ${user.lastName}?`,
                        )
                      ) {
                        deleteMutation.mutate(user.id);
                      }
                    }}
                    className="rounded-md border border-accent/40 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-ink/60" colSpan={6}>
                No users yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
