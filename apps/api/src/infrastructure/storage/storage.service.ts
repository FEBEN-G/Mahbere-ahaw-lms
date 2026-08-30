import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, unlink } from 'fs';
import { promisify } from 'util';
import { Readable } from 'stream';
import { LocalStorageDriver } from './local.storage.driver';
import { MinioStorageDriver } from './minio.storage.driver';
import type { SaveStreamInput, StorageDriver, StoredFile } from './storage.driver';

const unlinkAsync = promisify(unlink);

@Injectable()
export class StorageService implements StorageDriver {
  private readonly driver: StorageDriver;

  constructor(
    private readonly configService: ConfigService,
    private readonly localDriver: LocalStorageDriver,
    private readonly minioDriver: MinioStorageDriver,
  ) {
    const mode = this.configService.get<string>('storage.driver') ?? 'local';
    this.driver = mode === 'minio' ? this.minioDriver : this.localDriver;
  }

  saveBuffer(
    buffer: Buffer,
    input: { originalName: string; mimeType: string; folder: string },
  ): Promise<StoredFile> | StoredFile {
    return this.driver.saveBuffer(buffer, input);
  }

  saveStream(stream: Readable, input: SaveStreamInput): Promise<StoredFile> {
    return this.driver.saveStream(stream, input);
  }

  /**
   * Streams a disk-backed multer file into object storage, then deletes the temp file.
   */
  async saveUploadedFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<StoredFile> {
    if (!file.path) {
      // Fallback if memory storage somehow used
      return this.saveBuffer(file.buffer, {
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder,
      });
    }

    const stream = createReadStream(file.path);
    try {
      return await this.saveStream(stream, {
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder,
        sizeBytes: file.size,
      });
    } finally {
      stream.destroy();
      await unlinkAsync(file.path).catch(() => undefined);
    }
  }

  fileExists(objectKey: string): Promise<boolean> | boolean {
    return this.driver.fileExists(objectKey);
  }

  createReadStream(objectKey: string): Promise<Readable> | Readable {
    return this.driver.createReadStream(objectKey);
  }
}

export type { StoredFile };
