export interface StoredUploadMetadata {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export function isSameUploadedFile(
  file: File,
  existing: StoredUploadMetadata,
): boolean {
  return (
    file.name.trim().toLowerCase() === existing.originalName.trim().toLowerCase() &&
    file.type === existing.mimeType &&
    file.size === existing.sizeBytes
  );
}

export function findDuplicateUpload(
  file: File,
  existingFiles: StoredUploadMetadata[],
): StoredUploadMetadata | undefined {
  return existingFiles.find((existing) => isSameUploadedFile(file, existing));
}
