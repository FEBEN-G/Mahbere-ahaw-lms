"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  downloadCourseAttachmentRequest,
  getCourseRequest,
} from "@/lib/courses/api";
import { authenticatedBlob } from "@/lib/api/upload-client";
import { toEmbedUrl } from "@/lib/media/embed-url";
import {
  getOfflineCourse,
  saveOfflineAssignmentPrompt,
  saveOfflineCourse,
  saveOfflineFile,
} from "@/lib/offline/db";
import { useConnectivityStore } from "@/lib/offline/connectivity-store";

export function StudentCourseDetail({ courseId }: { courseId: string }) {
  const online = useConnectivityStore((state) => state.online);
  const [offlineSaved, setOfflineSaved] = useState(false);

  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      if (!navigator.onLine) {
        const cached = await getOfflineCourse(courseId);
        if (cached?.payload) {
          return cached.payload as Awaited<ReturnType<typeof getCourseRequest>>;
        }
        throw new Error("Course not available offline");
      }
      return getCourseRequest(courseId);
    },
  });

  const downloadOfflineMutation = useMutation({
    mutationFn: async () => {
      const course = await getCourseRequest(courseId);
      await saveOfflineCourse({
        id: course.id,
        title: course.title,
        description: course.description,
        monthNumber: course.monthNumber,
        payload: course,
      });

      for (const courseModule of course.modules) {
        for (const attachment of courseModule.attachments) {
          if (attachment.externalUrl || !attachment.id) continue;
          const blob = await authenticatedBlob(
            `/courses/attachments/${attachment.id}/download`,
          );
          await saveOfflineFile({
            attachmentId: attachment.id,
            courseId: course.id,
            title: attachment.title,
            mimeType: blob.type || "application/octet-stream",
            blob,
          });
        }
      }

      for (const assignment of course.assignments) {
        if (!assignment.objectKey) continue;
        const blob = await authenticatedBlob(
          `/assignments/${assignment.id}/download`,
        );
        await saveOfflineAssignmentPrompt({
          assignmentId: assignment.id,
          courseId: course.id,
          title: assignment.title,
          originalName: assignment.originalName ?? `${assignment.title}.pdf`,
          mimeType: blob.type || "application/octet-stream",
          blob,
        });
      }
    },
    onSuccess: () => setOfflineSaved(true),
  });

  if (courseQuery.isLoading) {
    return <p className="text-sm text-ink/60">Loading course...</p>;
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <p className="text-sm text-accent">
        {(courseQuery.error as Error)?.message ?? "Course unavailable"}
      </p>
    );
  }

  const course = courseQuery.data;

  return (
    <section className="animate-rise space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-moss">
            Month {course.monthNumber}
          </p>
          <h1 className="font-[family-name:var(--font-source-serif)] text-3xl text-ink">
            {course.title}
          </h1>
          <p className="mt-2 text-ink/70">{course.description}</p>
        </div>
        {online ? (
          <button
            type="button"
            disabled={downloadOfflineMutation.isPending}
            onClick={() => downloadOfflineMutation.mutate()}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-sand disabled:opacity-60"
          >
            {downloadOfflineMutation.isPending
              ? "Saving offline…"
              : offlineSaved
                ? "Saved for offline"
                : "Download for offline"}
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Modules</h2>
        {course.modules.map((courseModule) => (
          <article
            key={courseModule.id}
            className="rounded-xl border border-line bg-white/80 p-4"
          >
            <h3 className="font-semibold text-ink">{courseModule.title}</h3>
            <p className="text-sm text-ink/65">{courseModule.description}</p>
            <ul className="mt-3 space-y-3 text-sm">
              {courseModule.attachments.map((attachment) => {
                const embedUrl = attachment.externalUrl
                  ? toEmbedUrl(attachment.externalUrl)
                  : null;
                return (
                  <li key={attachment.id} className="space-y-2">
                    {attachment.externalUrl ? (
                      <div className="space-y-2">
                        <p className="font-medium text-ink">{attachment.title}</p>
                        {embedUrl ? (
                          <div className="aspect-video overflow-hidden rounded-lg border border-line bg-black/5">
                            <iframe
                              title={attachment.title}
                              src={embedUrl}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <a
                            href={attachment.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-forest hover:underline"
                          >
                            Open instructional video
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/student/courses/${courseId}/read/${attachment.id}?title=${encodeURIComponent(attachment.title)}&type=${encodeURIComponent(attachment.type)}`}
                          className="text-forest hover:underline"
                        >
                          {attachment.title} (open reader)
                        </Link>
                        <button
                          type="button"
                          className="text-ink/60 hover:underline"
                          onClick={() =>
                            void downloadCourseAttachmentRequest(
                              attachment.id,
                              attachment.originalName ?? attachment.title,
                            )
                          }
                        >
                          Download
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
