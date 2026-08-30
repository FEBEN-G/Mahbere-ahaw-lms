import { Readable } from 'stream';

export interface StoredFile {
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SaveStreamInput {
  originalName: string;
  mimeType: string;
  folder: string;
  sizeBytes: number;
}

export interface StorageDriver {
  saveBuffer(
    buffer: Buffer,
    input: { originalName: string; mimeType: string; folder: string },
  ): Promise<StoredFile> | StoredFile;

  saveStream(
    stream: Readable,
    input: SaveStreamInput,
  ): Promise<StoredFile>;

  fileExists(objectKey: string): Promise<boolean> | boolean;

  createReadStream(objectKey: string): Promise<Readable> | Readable;
}
