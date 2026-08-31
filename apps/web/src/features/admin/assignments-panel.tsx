"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FileDropzone } from "@/components/uploads/file-dropzone";
import { Panel } from "@/components/layout/panel";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "@/components/ui/feedback";
import {
  createAssignmentRequest,
  deleteAssignmentRequest,
  listCourseAssignmentsRequest,
  type AssignmentItem,
  updateAssignmentRequest,
} from "@/lib/assignments/api";
import { listCoursesRequest } from "@/lib/courses/api";

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminAssignmentsPanel() {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [promptFile, setPromptFile] = useState<File | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => listCoursesRequest(),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["assignments", courseId],
    enabled: Boolean(courseId),
    queryFn: () => listCourseAssignmentsRequest(courseId),
  });

  useEffect(() => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDueAt("");
    setMaxScore("100");
    setPromptFile(null);
    setActionError(null);
  }, [courseId]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDueAt("");
    setMaxScore("100");
    setPromptFile(null);
    setActionError(null);
  }

  function startEdit(assignment: AssignmentItem) {
    setEditingId(assignment.id);
    setTitle(assignment.title);
    setDescription(assignment.description ?? "");
    setDueAt(toLocalInputValue(assignment.dueAt));
    setMaxScore(String(assignment.maxScore ?? 100));
    setPromptFile(null);
    setActionError(null);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append(
        "description",
        description.trim() || "Complete and upload your work.",
      );
      formData.append("dueAt", new Date(dueAt).toISOString());
      formData.append("maxScore", maxScore || "100");
      if (promptFile) formData.append("file", promptFile);

      if (editingId) {
        return updateAssignmentRequest(editingId, formData);
      }
      return createAssignmentRequest(courseId, formData);
    },
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssignmentRequest,
    onSuccess: async () => {
      if (editingId) resetForm();
      await queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const courses = coursesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const canSave =
    Boolean(courseId) &&
    title.trim().length >= 3 &&
    Boolean(dueAt) &&
    !saveMutation.isPending;

  return (
    <div className="space-y-6">
      <Panel
        title={editingId ? "Edit assignment" : "Create assignment"}
        description="Set the prompt, due date, and optional file students can download."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-ink/70">Course</span>
            <select
              className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  Month {course.monthNumber}: {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-ink/70">Title</span>
            <input
              className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Reflection essay"
            />
          </label>

          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-ink/70">Description</span>
            <textarea
              className="min-h-[88px] w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Instructions for students"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink/70">Due date</span>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink/70">Max score</span>
            <input
              type="number"
              min={1}
              className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
              value={maxScore}
              onChange={(event) => setMaxScore(event.target.value)}
            />
          </label>

          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-ink/70">
              Prompt file (optional)
            </p>
            <FileDropzone
              disabled={saveMutation.isPending}
              label={
                promptFile
                  ? promptFile.name
                  : "Drop PDF or Word prompt (optional)"
              }
              onFile={(file) => setPromptFile(file)}
            />
          </div>
        </div>

        {actionError ? (
          <div className="mt-4">
            <ErrorBanner message={actionError} />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => saveMutation.mutate()}
            className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
          >
            {saveMutation.isPending
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Create assignment"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-sand"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </Panel>

      <Panel
        title="Course assignments"
        description={
          courseId
            ? "Select an assignment to edit, or remove one that is no longer needed."
            : "Choose a course above to view its assignments."
        }
      >
        {coursesQuery.isLoading ? (
          <LoadingBlock label="Loading courses…" />
        ) : null}
        {coursesQuery.isError ? (
          <ErrorBanner
            message={(coursesQuery.error as Error).message}
            onRetry={() => void coursesQuery.refetch()}
          />
        ) : null}

        {!courseId ? (
          <EmptyState
            title="No course selected"
            description="Pick a course to list and manage its assignments."
          />
        ) : assignmentsQuery.isLoading ? (
          <LoadingBlock label="Loading assignments…" />
        ) : assignmentsQuery.isError ? (
          <ErrorBanner
            message={(assignmentsQuery.error as Error).message}
            onRetry={() => void assignmentsQuery.refetch()}
          />
        ) : assignments.length === 0 ? (
          <EmptyState
            title="No assignments yet"
            description="Create the first assignment for this course using the form above."
          />
        ) : (
          <ul className="space-y-3">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className={`rounded-xl border px-4 py-3 ${
                  editingId === assignment.id
                    ? "border-forest/40 bg-sand/40"
                    : "border-line/70 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{assignment.title}</p>
                    <p className="mt-1 text-sm text-ink/55">
                      Due{" "}
                      {new Date(assignment.dueAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · Max {String(assignment.maxScore)}
                      {assignment.originalName
                        ? ` · File: ${assignment.originalName}`
                        : ""}
                    </p>
                    {assignment.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-ink/70">
                        {assignment.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(assignment)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-sand"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove assignment "${assignment.title}"?`,
                          )
                        ) {
                          deleteMutation.mutate(assignment.id);
                        }
                      }}
                      className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
