"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
    <section className="space-y-4 rounded-2xl border border-line/80 bg-white/90 p-5 shadow-[0_1px_0_rgba(19,35,28,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[200px] rounded-xl border border-line px-3 py-2 text-sm"
            placeholder="Search student, course, assignment"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="rounded-xl border border-line px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "ALL" | "PUBLISHED" | "DRAFT")
            }
          >
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
        <button
          type="button"
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
          className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
        >
          {exportMutation.isPending ? "Exporting…" : "Export Excel"}
        </button>
      </div>

      <p className="text-xs text-ink/55">
        Centralized gradebook for all scored submissions. Excel export includes
        the full dataset (not only this page).
      </p>

      {exportError ? <p className="text-sm text-accent">{exportError}</p> : null}
      {gradebookQuery.isLoading ? (
        <p className="text-sm text-ink/60">Loading gradebook...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink/60">No grades recorded yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
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

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-ink/55">
              Page {meta?.page ?? page} of {totalPages} · {meta?.total ?? 0}{" "}
              grades
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || gradebookQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || gradebookQuery.isFetching}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
              <button
                type="button"
                className="rounded-md border border-line px-3 py-1.5"
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
    </section>
  );
}
