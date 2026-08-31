"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Panel } from "@/components/layout/panel";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "@/components/ui/feedback";
import {
  listGradebookRequest,
  type GradebookRow,
} from "@/lib/grading/api";
import {
  downloadGradebookExport,
  getGradebookExportJob,
  requestGradebookExport,
} from "@/lib/reports/api";

const PAGE_SIZE = 25;

export function AdminGradebookPanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);

  const gradebookQuery = useQuery({
    queryKey: ["gradebook", page, PAGE_SIZE],
    queryFn: () => listGradebookRequest(page, PAGE_SIZE),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      setExportError(null);
      const job = await requestGradebookExport();
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const current = await getGradebookExportJob(job.id);
        if (current.status === "READY") {
          await downloadGradebookExport(
            job.id,
            current.originalName ?? "gradebook.xlsx",
          );
          return;
        }
        if (current.status === "FAILED") {
          throw new Error(current.error ?? "Export failed");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error("Export timed out");
    },
    onError: (error) => {
      setExportError(error instanceof Error ? error.message : "Export failed");
    },
  });

  const rows = useMemo(() => {
    const items = gradebookQuery.data?.items ?? [];
    const term = search.trim().toLowerCase();
    return items.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) {
        return false;
      }
      if (!term) return true;
      const student = `${row.submission.student.user.firstName} ${row.submission.student.user.lastName}`.toLowerCase();
      const course = row.submission.assignment.course.title.toLowerCase();
      const assignment = row.submission.assignment.title.toLowerCase();
      return (
        student.includes(term) ||
        course.includes(term) ||
        assignment.includes(term)
      );
    });
  }, [gradebookQuery.data?.items, search, statusFilter]);

  const meta = gradebookQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <Panel
      title="Gradebook"
      description="Centralized scores for all graded submissions. Excel export includes the full dataset."
      action={
        <button
          type="button"
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
          className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
        >
          {exportMutation.isPending ? "Exporting…" : "Export Excel"}
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="block min-w-[200px] flex-1 space-y-1 text-sm">
          <span className="font-medium text-ink/70">Search</span>
          <input
            className="w-full rounded-xl border border-line px-3 py-2 outline-none ring-forest/20 focus:ring-2"
            placeholder="Student, course, assignment"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink/70">Status</span>
          <select
            className="w-full rounded-xl border border-line px-3 py-2 outline-none ring-forest/20 focus:ring-2"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "ALL" | "PUBLISHED" | "DRAFT")
            }
          >
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>
      </div>

      {exportError ? <ErrorBanner message={exportError} /> : null}

      {gradebookQuery.isLoading ? (
        <LoadingBlock label="Loading gradebook…" />
      ) : gradebookQuery.isError ? (
        <ErrorBanner
          message={(gradebookQuery.error as Error).message}
          onRetry={() => void gradebookQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No grades recorded yet"
          description="Published instructor grades will appear here."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink/60">
                  <th className="py-2 pr-3 font-medium">Student</th>
                  <th className="py-2 pr-3 font-medium">Course</th>
                  <th className="py-2 pr-3 font-medium">Assignment</th>
                  <th className="py-2 pr-3 font-medium">Score</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: GradebookRow) => (
                  <tr key={row.id} className="border-b border-line/60">
                    <td className="py-2 pr-3">
                      {row.submission.student.user.firstName}{" "}
                      {row.submission.student.user.lastName}
                    </td>
                    <td className="py-2 pr-3">
                      {row.submission.assignment.course.title}
                    </td>
                    <td className="py-2 pr-3">
                      {row.submission.assignment.title}
                    </td>
                    <td className="py-2 pr-3">{row.score}</td>
                    <td className="py-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {rows.map((row: GradebookRow) => (
              <li
                key={row.id}
                className="rounded-xl border border-line/70 px-4 py-3"
              >
                <p className="font-medium text-ink">
                  {row.submission.student.user.firstName}{" "}
                  {row.submission.student.user.lastName}
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  {row.submission.assignment.course.title}
                </p>
                <p className="mt-1 text-sm text-ink/70">
                  {row.submission.assignment.title} · Score {row.score} ·{" "}
                  {row.status}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-ink/55">
              Page {meta?.page ?? page} of {totalPages} · {meta?.total ?? 0}{" "}
              grades
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || gradebookQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || gradebookQuery.isFetching}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
              <button
                type="button"
                className="rounded-lg border border-line px-3 py-1.5"
                onClick={() =>
                  void queryClient.invalidateQueries({ queryKey: ["gradebook"] })
                }
              >
                Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
