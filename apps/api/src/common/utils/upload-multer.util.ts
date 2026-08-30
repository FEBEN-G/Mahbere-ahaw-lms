import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { MULTER_MAX_FILE_SIZE_BYTES } from '../utils/file-validation.util';

const uploadTempDir = resolve(process.cwd(), '../../storage/tmp-uploads');

function ensureTempDir() {
  if (!existsSync(uploadTempDir)) {
    mkdirSync(uploadTempDir, { recursive: true });
  }
}

/**
 * Disk-backed multer config so large files are not held entirely in RAM.
 * Controllers should stream from `file.path` into object storage.
 */
export function createUploadInterceptorOptions() {
  ensureTempDir();
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        ensureTempDir();
        cb(null, uploadTempDir);
      },
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname).slice(0, 16);
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: {
      fileSize: MULTER_MAX_FILE_SIZE_BYTES,
    },
  };
}

export function getUploadTempDir() {
  return uploadTempDir;
}

export function joinTempUploadPath(filename: string) {
  return join(uploadTempDir, filename);
}
