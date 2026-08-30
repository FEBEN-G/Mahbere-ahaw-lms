"use client";

import { useEffect, useState } from "react";
import mammoth from "mammoth";
import { authenticatedBlob } from "@/lib/api/upload-client";
import { getOfflineFile } from "@/lib/offline/db";
import { recordAttachmentProgressRequest } from "@/lib/students/api";

interface DocxReaderProps {
  attachmentId: string;
  title: string;
}

export function DocxReader({ attachmentId, title }: DocxReaderProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const offline = await getOfflineFile(attachmentId);
        const blob = offline
          ? offline.blob
          : await authenticatedBlob(
              `/courses/attachments/${attachmentId}/download`,
            );

        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) {
          setHtml(result.value);
          void (async () => {
            if (typeof navigator !== "undefined" && navigator.onLine) {
              await recordAttachmentProgressRequest(attachmentId).catch(
                () => undefined,
              );
            }
          })();
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load document",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [attachmentId]);

  if (error) {
    return <p className="text-sm text-accent">{error}</p>;
  }

  if (!html) {
    return <p className="text-sm text-ink/60">Loading document…</p>;
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-ink">{title}</h2>
      <article
        className="readable-content prose prose-sm max-w-none rounded-lg border border-line bg-white p-6 text-ink prose-headings:text-ink prose-p:text-ink/85"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
