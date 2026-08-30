"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileDropzoneProps {
  accept?: Record<string, string[]>;
  disabled?: boolean;
  label?: string;
  onFile: (file: File) => void;
}

export function FileDropzone({
  accept = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
  },
  disabled,
  label = "Drop a file here, or click to browse",
  onFile,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled,
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-lg border border-dashed px-4 py-6 text-center text-sm transition ${
        isDragActive
          ? "border-forest bg-sand/60"
          : "border-line bg-white/70 hover:bg-sand/40"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <input {...getInputProps()} />
      <p className="text-ink/70">{label}</p>
      <p className="mt-1 text-xs text-ink/45">PDF, DOCX, PNG, JPG · max 10MB</p>
    </div>
  );
}
