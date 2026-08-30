import { Module } from '@nestjs/common';
import { QueuesModule } from '../../infrastructure/queues/queues.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { ReportsController } from './reports.controller';
import { ReportsProcessor } from './reports.processor';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({
  imports: [QueuesModule, StorageModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, ReportsProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
