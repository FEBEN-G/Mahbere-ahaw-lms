import { Module } from '@nestjs/common';
import { LocalStorageDriver } from './local.storage.driver';
import { MinioStorageDriver } from './minio.storage.driver';
import { StorageService } from './storage.service';

@Module({
  providers: [LocalStorageDriver, MinioStorageDriver, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
