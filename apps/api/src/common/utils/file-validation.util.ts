import { BadRequestException } from '@nestjs/common';
import { getMaxUploadMb } from './program-policy';

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]);

export const MULTER_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function getMaxFileSizeBytes() {
  return getMaxUploadMb() * 1024 * 1024;
}

export function validateUploadFile(file?: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('File is required');
  }

  const maxBytes = getMaxFileSizeBytes();
  if (file.size > maxBytes) {
    throw new BadRequestException(`File exceeds ${getMaxUploadMb()}MB limit`);
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException('Unsupported file type');
  }
}

export function getAllowedMimeTypes(): string[] {
  return [...ALLOWED_MIME_TYPES];
}

export interface StoredUploadMetadata {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export function isDuplicateUpload(
  file: Express.Multer.File,
  existing: StoredUploadMetadata,
): boolean {
  const incomingName = file.originalname.trim().toLowerCase();
  const storedName = existing.originalName.trim().toLowerCase();

  return (
    incomingName === storedName &&
    file.mimetype === existing.mimeType &&
    file.size === existing.sizeBytes
  );
}
