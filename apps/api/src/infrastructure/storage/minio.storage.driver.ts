import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as Minio from 'minio';
import { Readable } from 'stream';
import type { SaveStreamInput, StorageDriver, StoredFile } from './storage.driver';

@Injectable()
export class MinioStorageDriver implements StorageDriver, OnModuleInit {
  private client!: Minio.Client;
  private bucket!: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const driver = this.configService.get<string>('storage.driver') ?? 'local';
    if (driver !== 'minio') {
      return;
    }

    this.bucket =
      this.configService.get<string>('storage.minio.bucket') ?? 'lms-content';
    this.client = new Minio.Client({
      endPoint:
        this.configService.get<string>('storage.minio.endpoint') ?? 'localhost',
      port: this.configService.get<number>('storage.minio.port') ?? 9000,
      useSSL: this.configService.get<boolean>('storage.minio.useSSL') ?? false,
      accessKey:
        this.configService.get<string>('storage.minio.accessKey') ??
        'minioadmin',
      secretKey:
        this.configService.get<string>('storage.minio.secretKey') ??
        'minioadmin',
    });

    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  private ensureClient(): void {
    if (!this.client) {
      throw new Error(
        'MinIO storage is not active. Set STORAGE_DRIVER=minio to use this driver.',
      );
    }
  }

  async saveBuffer(
    buffer: Buffer,
    input: { originalName: string; mimeType: string; folder: string },
  ): Promise<StoredFile> {
    this.ensureClient();
    const objectKey = this.buildObjectKey(input.folder, input.originalName);
    await this.client.putObject(this.bucket, objectKey, buffer, buffer.length, {
      'Content-Type': input.mimeType,
    });

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
    this.ensureClient();
    const objectKey = this.buildObjectKey(input.folder, input.originalName);
    await this.client.putObject(
      this.bucket,
      objectKey,
      stream,
      input.sizeBytes,
      {
        'Content-Type': input.mimeType,
      },
    );

    return {
      objectKey,
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    };
  }

  async fileExists(objectKey: string): Promise<boolean> {
    this.ensureClient();
    try {
      await this.client.statObject(this.bucket, objectKey);
      return true;
    } catch {
      return false;
    }
  }

  async createReadStream(objectKey: string): Promise<Readable> {
    this.ensureClient();
    return this.client.getObject(this.bucket, objectKey);
  }

  private buildObjectKey(folder: string, originalName: string) {
    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
    return `${safeFolder}/${randomUUID()}-${originalName}`;
  }
}
