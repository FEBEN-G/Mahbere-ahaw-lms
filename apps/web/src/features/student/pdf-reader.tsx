"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { authenticatedBlob } from "@/lib/api/upload-client";
import { getOfflineFile } from "@/lib/offline/db";
import { recordAttachmentProgressRequest } from "@/lib/students/api";

// Bundled locally so PDF reading works offline (no CDN).
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfReaderProps {
  attachmentId: string;
  title: string;
}

export function PdfReader({ attachmentId, title }: PdfReaderProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      try {
        const offline = await getOfflineFile(attachmentId);
        if (offline) {
          objectUrl = URL.createObjectURL(offline.blob);
        } else {
          const blob = await authenticatedBlob(
            `/courses/attachments/${attachmentId}/download`,
          );
          objectUrl = URL.createObjectURL(blob);
        }
        if (!cancelled) setUrl(objectUrl);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load PDF",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId]);

  if (error) {
    return <p className="text-sm text-accent">{error}</p>;
  }

  if (!url) {
    return <p className="text-sm text-ink/60">Loading PDF…</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-ink">{title}</h2>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            className="rounded border border-line px-2 py-1 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Prev
          </button>
          <span>
            {page} / {pages || "…"}
          </span>
          <button
            type="button"
            className="rounded border border-line px-2 py-1 disabled:opacity-40"
            disabled={!pages || page >= pages}
            onClick={() =>
              setPage((current) =>
                pages ? Math.min(pages, current + 1) : current,
              )
            }
          >
            Next
          </button>
        </div>
      </div>
      <div className="overflow-auto rounded-lg border border-line bg-white p-2">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => {
            setPages(numPages);
            if (typeof navigator !== "undefined" && navigator.onLine) {
              void recordAttachmentProgressRequest(attachmentId).catch(
                () => undefined,
              );
            }
          }}
          loading={<p className="p-4 text-sm text-ink/60">Rendering…</p>}
        >
          <Page pageNumber={page} width={720} />
        </Document>
      </div>
    </div>
  );
}
