import { InjectQueue } from '@nestjs/bullmq';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExportJobStatus, Role } from '@prisma/client';
import { Queue } from 'bullmq';
import {
  ExportGradebookJob,
  QUEUE_NAMES,
} from '../../infrastructure/queues/queue.constants';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly storageService: StorageService,
    @InjectQueue(QUEUE_NAMES.EXPORTS)
    private readonly exportsQueue: Queue<ExportGradebookJob>,
  ) {}

  async requestGradebookExport(userId: string) {
    const job = await this.reportsRepository.createExportJob(userId);
    await this.exportsQueue.add(
      'export-gradebook',
      { exportJobId: job.id },
      {
        attempts: 2,
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    );
    return job;
  }

  async getExportJob(userId: string, role: Role, jobId: string) {
    const job = await this.reportsRepository.findExportJob(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }
    if (role !== Role.SUPER_ADMIN && job.requestedById !== userId) {
      throw new ForbiddenException('Not your export job');
    }
    return job;
  }

  async downloadExport(userId: string, role: Role, jobId: string) {
    const job = await this.getExportJob(userId, role, jobId);
    if (job.status !== ExportJobStatus.READY || !job.objectKey) {
      throw new NotFoundException('Export not ready');
    }
    if (!(await this.storageService.fileExists(job.objectKey))) {
      throw new NotFoundException('Export file missing');
    }
    return {
      stream: await this.storageService.createReadStream(job.objectKey),
      mimeType:
        job.mimeType ??
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      originalName: job.originalName ?? 'gradebook.xlsx',
    };
  }
}
