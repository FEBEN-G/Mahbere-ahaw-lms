"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { listCourseAssignmentsRequest } from "@/lib/assignments/api";
import { instructorReviewStatusLabel } from "@/lib/content/display-labels";
import {
  gradeSubmissionRequest,
  publishGradeRequest,
} from "@/lib/grading/api";
import { getInstructorMeRequest } from "@/lib/instructors/api";
import {
  downloadSubmissionRequest,
  listSubmissionsForAssignmentRequest,
  type SubmissionItem,
} from "@/lib/submissions/api";

type StatusFilter = "ALL" | "NEEDS_GRADING" | "DRAFT" | "PUBLISHED" | "LATE";

function toNumber(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function submissionStatusLabel(submission: SubmissionItem): string {
  return instructorReviewStatusLabel({
    submissionStatus: submission.status,
    gradeStatus: submission.grade?.status,
    hasGrade: Boolean(submission.grade?.id),
  });
}

function matchesStatus(submission: SubmissionItem, filter: StatusFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "LATE") return submission.status === "LATE";
  if (filter === "PUBLISHED") return submission.grade?.status === "PUBLISHED";
  if (filter === "DRAFT")
    return Boolean(submission.grade?.id) && submission.grade?.status !== "PUBLISHED";
  return !submission.grade;
}

export function InstructorGradingPanel() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["instructor-me"],
    queryFn: getInstructorMeRequest,
  });

  const courses = profileQuery.data?.assignedCourses ?? [];

  const assignmentsQuery = useQuery({
    queryKey: ["instructor-assignments", selectedCourseId],
    enabled: Boolean(selectedCourseId),
    queryFn: () => listCourseAssignmentsRequest(selectedCourseId),
  });

  const submissionsQuery = useQuery({
    queryKey: ["submissions", selectedAssignmentId],
    enabled: Boolean(selectedAssignmentId),
    queryFn: () => listSubmissionsForAssignmentRequest(selectedAssignmentId),
  });

  const assignments = assignmentsQuery.data ?? [];
  const selectedAssignment = assignments.find(
    (assignment) => assignment.id === selectedAssignmentId,
  );
  const maxScore = toNumber(selectedAssignment?.maxScore ?? 100);

  useEffect(() => {
    const items = submissionsQuery.data ?? [];
    setScores((current) => {
      const next = { ...current };
      for (const submission of items) {
        if (next[submission.id] === undefined && submission.grade?.score != null) {
          next[submission.id] = String(submission.grade.score);
        }
      }
      return next;
    });
    setFeedback((current) => {
      const next = { ...current };
      for (const submission of items) {
        if (next[submission.id] === undefined && submission.grade?.feedback) {
          next[submission.id] = submission.grade.feedback;
        }
      }
      return next;
    });
  }, [submissionsQuery.data]);

  const gradeMutation = useMutation({
    mutationFn: ({
      submissionId,
      score,
      feedbackText,
    }: {
      submissionId: string;
      score: number;
      feedbackText?: string;
    }) =>
      gradeSubmissionRequest(submissionId, {
        score,
        feedback: feedbackText,
      }),
    onSuccess: async () => {
      setErrorMessage(null);
      setMessage("Grade saved. Share it with the student when you are ready.");
      await queryClient.invalidateQueries({
        queryKey: ["submissions", selectedAssignmentId],
      });
      await queryClient.invalidateQueries({ queryKey: ["instructor-me"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-instructor"] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishGradeRequest,
    onSuccess: async () => {
      setErrorMessage(null);
      setMessage("Grade shared. The student can now see the score and feedback.");
      await queryClient.invalidateQueries({
        queryKey: ["submissions", selectedAssignmentId],
      });
      await queryClient.invalidateQueries({ queryKey: ["instructor-me"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-instructor"] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const submissions = useMemo(() => {
    const items = submissionsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    return items.filter((submission) => {
      if (!matchesStatus(submission, statusFilter)) return false;
      if (!term) return true;
      const name = `${submission.student?.user.firstName ?? ""} ${submission.student?.user.lastName ?? ""}`.toLowerCase();
      const email = submission.student?.user.email.toLowerCase() ?? "";
      const file = submission.originalName.toLowerCase();
      return name.includes(term) || email.includes(term) || file.includes(term);
    });
  }, [search, statusFilter, submissionsQuery.data]);

  function saveGrade(submission: SubmissionItem) {
    const raw = scores[submission.id];
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0) {
      setErrorMessage("Enter a valid numerical score.");
      setMessage(null);
      return;
    }
    if (score > maxScore) {
      setErrorMessage(`Score cannot exceed ${maxScore}.`);
      setMessage(null);
      return;
    }
    const feedbackText = feedback[submission.id]?.trim();
    gradeMutation.mutate({
      submissionId: submission.id,
      score,
      feedbackText: feedbackText || undefined,
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line/80 bg-white/90 p-4 shadow-[0_1px_0_rgba(19,35,28,0.04)] sm:p-5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink/70">Course</span>
          <select
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2"
            value={selectedCourseId}
            onChange={(event) => {
              setSelectedCourseId(event.target.value);
              setSelectedAssignmentId("");
            }}
          >
            <option value="">Filter by course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                Month {course.monthNumber}: {course.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink/70">Assignment</span>
          <select
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2"
            value={selectedAssignmentId}
            disabled={!selectedCourseId}
            onChange={(event) => setSelectedAssignmentId(event.target.value)}
          >
            <option value="">Filter by assignment</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink/70">Status</span>
          <select
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <option value="ALL">All submissions</option>
            <option value="NEEDS_GRADING">Needs grading</option>
            <option value="DRAFT">Not shared yet</option>
            <option value="PUBLISHED">Shared with student</option>
            <option value="LATE">Late</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink/70">Search</span>
          <input
            className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2"
            placeholder="Student or file"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {message ? (
        <p className="rounded-md border border-forest/30 bg-sand px-3 py-2 text-sm text-forest">
          {message}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          {errorMessage}
        </p>
      ) : null}

      {!selectedAssignmentId ? (
        <p className="text-sm text-ink/60">
          Choose a course and assignment to start grading.
        </p>
      ) : submissionsQuery.isLoading ? (
        <p className="text-sm text-ink/60">Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-ink/60">
          No submissions match the current filters.
        </p>
      ) : (
        <ul className="space-y-4">
          {submissions.map((submission) => {
            const published = submission.grade?.status === "PUBLISHED";
            return (
              <li
                key={submission.id}
                className="rounded-2xl border border-line/70 bg-mist/40 p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {submission.student?.user.firstName}{" "}
                      {submission.student?.user.lastName}
                    </p>
                    <p className="text-ink/55">{submission.student?.user.email}</p>
                    <p className="mt-1 text-xs text-ink/50">
                      {submission.originalName}
                      {submission.submittedAt
                        ? ` · Submitted ${new Date(submission.submittedAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink/70">
                      {submissionStatusLabel(submission)}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-sand"
                      onClick={() =>
                        void downloadSubmissionRequest(
                          submission.id,
                          submission.originalName,
                        )
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download work
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)] lg:grid-cols-[160px_minmax(0,1fr)]">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                      Score
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={maxScore}
                        step="0.5"
                        disabled={published}
                        placeholder="0"
                        className="w-full rounded-xl border border-line px-3 py-2 outline-none ring-forest/20 focus:ring-2 disabled:bg-sand/60"
                        value={scores[submission.id] ?? ""}
                        onChange={(event) =>
                          setScores((current) => ({
                            ...current,
                            [submission.id]: event.target.value,
                          }))
                        }
                      />
                      <span className="shrink-0 text-xs text-ink/50">
                        / {maxScore}
                      </span>
                    </div>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                      Feedback for the student
                    </span>
                    <textarea
                      rows={4}
                      maxLength={4000}
                      disabled={published}
                      placeholder="Explain the score, note corrections, and give the student clear next steps."
                      className="w-full resize-y rounded-xl border border-line px-3 py-2 outline-none ring-forest/20 focus:ring-2 disabled:bg-sand/60"
                      value={feedback[submission.id] ?? ""}
                      onChange={(event) =>
                        setFeedback((current) => ({
                          ...current,
                          [submission.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={published || gradeMutation.isPending}
                    className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-sand disabled:opacity-50"
                    onClick={() => saveGrade(submission)}
                  >
                    Save grade
                  </button>
                  {submission.grade?.id && !published ? (
                    <button
                      type="button"
                      disabled={publishMutation.isPending}
                      className="rounded-xl bg-forest px-3 py-1.5 text-xs font-semibold text-white hover:bg-moss disabled:opacity-50"
                      onClick={() =>
                        publishMutation.mutate(submission.grade!.id)
                      }
                    >
                      Share with student
                    </button>
                  ) : null}
                  {published ? (
                    <p className="self-center text-xs text-moss">
                      Shared grades cannot be edited.
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
