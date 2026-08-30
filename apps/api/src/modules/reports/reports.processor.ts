import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ExportJobStatus } from '@prisma/client';
import { Job } from 'bullmq';
import * as ExcelJS from 'exceljs';
import {
  ExportGradebookJob,
  QUEUE_NAMES,
} from '../../infrastructure/queues/queue.constants';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { ReportsRepository } from './reports.repository';

@Processor(QUEUE_NAMES.EXPORTS)
export class ReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportsProcessor.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error({
      msg: 'job_failed',
      queue: QUEUE_NAMES.EXPORTS,
      jobId: job?.id,
      jobName: job?.name,
      attemptsMade: job?.attemptsMade,
      error: error.message,
    });
  }

  async process(job: Job<ExportGradebookJob>) {
    const exportJobId = job.data.exportJobId;
    await this.reportsRepository.updateExportJob(exportJobId, {
      status: ExportJobStatus.PROCESSING,
    });

    try {
      const rows = await this.reportsRepository.listGradebookRows();
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Gradebook');
      sheet.columns = [
        { header: 'Student', key: 'student', width: 28 },
        { header: 'Email', key: 'email', width: 32 },
        { header: 'Course', key: 'course', width: 28 },
        { header: 'Month', key: 'month', width: 10 },
        { header: 'Assignment', key: 'assignment', width: 28 },
        { header: 'Score', key: 'score', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Feedback', key: 'feedback', width: 40 },
        { header: 'Instructor', key: 'instructor', width: 24 },
      ];

      for (const row of rows) {
        sheet.addRow({
          student: `${row.submission.student.user.firstName} ${row.submission.student.user.lastName}`,
          email: row.submission.student.user.email,
          course: row.submission.assignment.course.title,
          month: row.submission.assignment.course.monthNumber,
          assignment: row.submission.assignment.title,
          score: Number(row.score),
          status: row.status,
          feedback: row.feedback ?? '',
          instructor: `${row.instructor.user.firstName} ${row.instructor.user.lastName}`,
        });
      }

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      const stored = await this.storageService.saveBuffer(buffer, {
        originalName: `gradebook-${exportJobId}.xlsx`,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        folder: 'exports',
      });

      await this.reportsRepository.updateExportJob(exportJobId, {
        status: ExportJobStatus.READY,
        objectKey: stored.objectKey,
        mimeType: stored.mimeType,
        originalName: stored.originalName,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Export failed';
      this.logger.error(message);
      await this.reportsRepository.updateExportJob(exportJobId, {
        status: ExportJobStatus.FAILED,
        error: message,
      });
      throw error;
    }
  }
}
