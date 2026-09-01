"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Panel } from "@/components/layout/panel";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "@/components/ui/feedback";
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
    return (
      <Panel title="Directory" description="Active seminary accounts.">
        <LoadingBlock label="Loading users…" />
      </Panel>
    );
  }

  if (usersQuery.isError) {
    return (
      <Panel title="Directory" description="Active seminary accounts.">
        <ErrorBanner
          message={(usersQuery.error as Error).message}
          onRetry={() => void usersQuery.refetch()}
        />
      </Panel>
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <Panel
      title="Directory"
      description="Activate, deactivate, or remove accounts."
    >
      {users.length === 0 ? (
        <EmptyState
          title="No users yet"
          description="Register a student or instructor above to populate the directory."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-sand/70 text-ink/70">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Current month</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-line/70 last:border-0"
                  >
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
                      <UserActions
                        user={user}
                        statusPending={statusMutation.isPending}
                        deletePending={deleteMutation.isPending}
                        onToggle={() =>
                          statusMutation.mutate({
                            id: user.id,
                            isActive: !user.isActive,
                          })
                        }
                        onDelete={() => deleteMutation.mutate(user.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {users.map((user) => (
              <li
                key={user.id}
                className="rounded-xl border border-line/70 bg-white px-4 py-3"
              >
                <p className="font-medium text-ink">
                  {user.firstName} {user.lastName}
                </p>
                <p className="mt-1 text-sm text-ink/60">{user.email}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-ink/45">
                  {user.role} · {user.isActive ? "Active" : "Inactive"}
                  {user.unlockedMonth != null
                    ? ` · Month ${user.unlockedMonth}`
                    : ""}
                </p>
                <div className="mt-3">
                  <UserActions
                    user={user}
                    statusPending={statusMutation.isPending}
                    deletePending={deleteMutation.isPending}
                    onToggle={() =>
                      statusMutation.mutate({
                        id: user.id,
                        isActive: !user.isActive,
                      })
                    }
                    onDelete={() => deleteMutation.mutate(user.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

function UserActions({
  user,
  statusPending,
  deletePending,
  onToggle,
  onDelete,
}: {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  statusPending: boolean;
  deletePending: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={statusPending}
        onClick={onToggle}
        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:bg-sand disabled:opacity-60"
      >
        {user.isActive ? "Deactivate" : "Activate"}
      </button>
      <button
        type="button"
        disabled={deletePending}
        onClick={() => {
          if (
            window.confirm(`Remove ${user.firstName} ${user.lastName}?`)
          ) {
            onDelete();
          }
        }}
        className="rounded-lg border border-accent/40 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
      >
        Remove
      </button>
    </div>
  );
}
