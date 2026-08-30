import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'fs';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import type { SaveStreamInput, StorageDriver, StoredFile } from './storage.driver';

@Injectable()
export class LocalStorageDriver implements StorageDriver {
  private readonly basePath: string;

  constructor(private readonly configService: ConfigService) {
    const configuredPath =
      this.configService.get<string>('storage.localPath') ??
      '../../storage/uploads';
    this.basePath = resolve(process.cwd(), configuredPath);
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }
  }

  saveBuffer(
    buffer: Buffer,
    input: { originalName: string; mimeType: string; folder: string },
  ): StoredFile {
    const { absolutePath, objectKey } = this.resolveObjectPath(input);
    const directory = resolve(absolutePath, '..');
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    writeFileSync(absolutePath, buffer);

    return {
      objectKey,
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: buffer.length,
    };
  }

  async saveStream(
    stream: Readable,
    input: SaveStreamInput,
  ): Promise<StoredFile> {
    const { absolutePath, objectKey } = this.resolveObjectPath(input);
    const directory = resolve(absolutePath, '..');
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    await pipeline(stream, createWriteStream(absolutePath));

    return {
      objectKey,
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    };
  }

  getAbsolutePath(objectKey: string): string {
    return join(this.basePath, objectKey);
  }

  fileExists(objectKey: string): boolean {
    return existsSync(this.getAbsolutePath(objectKey));
  }

  createReadStream(objectKey: string): Readable {
    return createReadStream(this.getAbsolutePath(objectKey));
  }

  private resolveObjectPath(input: {
    originalName: string;
    folder: string;
  }) {
    const safeFolder = input.folder.replace(/[^a-zA-Z0-9/_-]/g, '');
    const objectKey = join(
      safeFolder,
      `${randomUUID()}-${input.originalName}`,
    ).replace(/\\/g, '/');
    return {
      objectKey,
      absolutePath: join(this.basePath, objectKey),
    };
  }
}
