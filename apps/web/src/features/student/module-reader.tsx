"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { getCourseRequest } from "@/lib/courses/api";

const PdfReader = dynamic(
  () => import("@/features/student/pdf-reader").then((module) => module.PdfReader),
  {
    ssr: false,
    loading: () => <p className="text-sm text-ink/60">Loading reader…</p>,
  },
);

const DocxReader = dynamic(
  () => import("@/features/student/docx-reader").then((module) => module.DocxReader),
  {
    ssr: false,
    loading: () => <p className="text-sm text-ink/60">Loading reader…</p>,
  },
);

interface ModuleReaderProps {
  courseId?: string;
  attachmentId: string;
  title: string;
  type?: string;
}

export function ModuleReader({
  courseId,
  attachmentId,
  title,
  type,
}: ModuleReaderProps) {
  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    enabled: Boolean(courseId) && !type,
    queryFn: () => getCourseRequest(courseId!),
  });

  const resolved =
    type ??
    courseQuery.data?.modules
      .flatMap((module) => module.attachments)
      .find((attachment) => attachment.id === attachmentId)?.type;

  const resolvedTitle =
    title ||
    courseQuery.data?.modules
      .flatMap((module) => module.attachments)
      .find((attachment) => attachment.id === attachmentId)?.title ||
    "Reading material";

  if (!type && courseId && courseQuery.isLoading) {
    return <p className="text-sm text-ink/60">Loading reader…</p>;
  }

  if (resolved === "DOCX") {
    return <DocxReader attachmentId={attachmentId} title={resolvedTitle} />;
  }

  return <PdfReader attachmentId={attachmentId} title={resolvedTitle} />;
}
