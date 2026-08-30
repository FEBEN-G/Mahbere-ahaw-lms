"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileDropzone } from "@/components/uploads/file-dropzone";
import { DueDateCountdown } from "@/components/ui/due-date-countdown";
import { listMyAssignmentsRequest } from "@/lib/assignments/api";
import { authenticatedDownload } from "@/lib/api/upload-client";
import {
  getOfflineAssignmentPrompt,
  listOfflineCourses,
} from "@/lib/offline/db";
import { useConnectivityStore } from "@/lib/offline/connectivity-store";
import { submitAssignmentRequest } from "@/lib/submissions/api";
import { isSameUploadedFile } from "@/lib/uploads/duplicate-file";

async function openOfflinePrompt(assignmentId: string, fallbackName: string) {
  const cached = await getOfflineAssignmentPrompt(assignmentId);
  if (!cached) {
    throw new Error(
      "Prompt not saved offline. Download the course for offline first.",
    );
  }
  const url = URL.createObjectURL(cached.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = cached.originalName || fallbackName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StudentAssignmentsPanel() {
  const queryClient = useQueryClient();
  const online = useConnectivityStore((state) => state.online);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: ["assignments-my", online],
    queryFn: async () => {
      if (!online) {
        const courses = await listOfflineCourses();
        return courses.flatMap((course) => {
          const payload = course.payload as {
            assignments?: Array<{
              id: string;
              title: string;
              dueAt: string;
              objectKey?: string | null;
              originalName?: string | null;
            }>;
          };
          return (payload.assignments ?? []).map((assignment) => ({
            id: assignment.id,
            title: assignment.title,
            description: null,
            dueAt: assignment.dueAt,
            maxScore: 0,
            objectKey: assignment.objectKey,
            originalName: assignment.originalName,
            course: {
              id: course.id,
              title: course.title,
              monthNumber: course.monthNumber,
            },
            mySubmission: null,
          }));
        });
      }
      return listMyAssignmentsRequest();
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ assignmentId, file }: { assignmentId: string; file: File }) =>
      submitAssignmentRequest(assignmentId, file),
    onSuccess: async () => {
      setUploadingId(null);
      setSubmitError(null);
      setSubmitMessage("Submission uploaded successfully.");
      await queryClient.invalidateQueries({ queryKey: ["assignments-my"] });
      await queryClient.invalidateQueries({ queryKey: ["submissions-my"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-student"] });
    },
    onError: (error: Error) => {
      setUploadingId(null);
      setSubmitMessage(null);
      setSubmitError(error.message || "Upload failed. Try again.");
    },
  });

  const assignments = assignmentsQuery.data ?? [];

  return (
    <section className="space-y-3">
      <p className="text-sm text-ink/65">
        Download the questionnaire, complete it as PDF, Word, or photo, then
        upload before the due date. Countdown timers update automatically.
      </p>
      {!online ? (
        <p className="rounded-xl border border-line bg-sand/60 px-4 py-3 text-sm text-ink/70">
          Offline mode: you can open saved assignment questions. Submitting
          requires an internet connection.
        </p>
      ) : null}
      {promptError ? <p className="text-sm text-accent">{promptError}</p> : null}
      {submitMessage ? (
        <p className="rounded-md border border-forest/30 bg-sand px-3 py-2 text-sm text-forest">
          {submitMessage}
        </p>
      ) : null}
      {submitError ? (
        <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          {submitError}
        </p>
      ) : null}
      {assignmentsQuery.isLoading ? (
        <p className="text-sm text-ink/60">Loading assignments...</p>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/70 px-5 py-10 text-center text-sm text-ink/60">
          {online
            ? "No assignments for unlocked months."
            : "No offline assignment prompts saved yet. Open a course online and choose Download for offline."}
        </div>
      ) : (
        <ul className="space-y-3">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="rounded-2xl border border-line/80 bg-white/90 p-5 text-sm shadow-[0_1px_0_rgba(19,35,28,0.04)] transition hover:border-moss/30"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{assignment.title}</p>
                    <p className="text-ink/60">
                      {assignment.course.title} · Month{" "}
                      {assignment.course.monthNumber} · Due{" "}
                      {new Date(assignment.dueAt).toLocaleString()}
                      {assignment.maxScore
                        ? ` · Max ${assignment.maxScore}`
                        : ""}
                    </p>
                    <div className="mt-2">
                      <DueDateCountdown dueAt={assignment.dueAt} />
                    </div>
                    {assignment.mySubmission ? (
                      <p className="mt-1 text-moss">
                        Submitted ({assignment.mySubmission.status}) ·{" "}
                        {new Date(
                          assignment.mySubmission.submittedAt,
                        ).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  {assignment.objectKey || !online ? (
                    <button
                      type="button"
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:bg-sand"
                      onClick={() => {
                        setPromptError(null);
                        if (!online) {
                          void openOfflinePrompt(
                            assignment.id,
                            assignment.originalName ??
                              `${assignment.title}.pdf`,
                          ).catch((error: Error) =>
                            setPromptError(error.message),
                          );
                          return;
                        }
                        void authenticatedDownload(
                          `/assignments/${assignment.id}/download`,
                          assignment.originalName ?? `${assignment.title}.pdf`,
                        );
                      }}
                    >
                      {online ? "Download questions" : "Open saved questions"}
                    </button>
                  ) : null}
                </div>
                {online ? (
                  <FileDropzone
                    disabled={uploadingId === assignment.id}
                    label={
                      uploadingId === assignment.id
                        ? "Uploading..."
                        : assignment.mySubmission
                          ? "Replace submission (PDF, Word, or photo)"
                          : "Upload completed work (PDF, Word, or photo)"
                    }
                    onFile={(file) => {
                      setSubmitMessage(null);
                      setSubmitError(null);

                      if (
                        assignment.mySubmission &&
                        isSameUploadedFile(file, assignment.mySubmission)
                      ) {
                        setSubmitError("File already uploaded.");
                        return;
                      }

                      setUploadingId(assignment.id);
                      submitMutation.mutate({
                        assignmentId: assignment.id,
                        file,
                      });
                    }}
                  />
                ) : (
                  <p className="text-xs text-ink/55">
                    Connect to the internet to upload your submission.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
