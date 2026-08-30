import { Injectable } from '@nestjs/common';
import { ExportJobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createExportJob(requestedById: string) {
    return this.prisma.exportJob.create({
      data: {
        requestedById,
        status: ExportJobStatus.PENDING,
      },
    });
  }

  findExportJob(id: string) {
    return this.prisma.exportJob.findFirst({ where: { id } });
  }

  updateExportJob(
    id: string,
    data: {
      status: ExportJobStatus;
      objectKey?: string;
      mimeType?: string;
      originalName?: string;
      error?: string | null;
      expiresAt?: Date;
    },
  ) {
    return this.prisma.exportJob.update({ where: { id }, data });
  }

  listGradebookRows() {
    return this.prisma.grade.findMany({
      where: { deletedAt: null },
      include: {
        submission: {
          include: {
            assignment: { include: { course: true } },
            student: { include: { user: true } },
          },
        },
        instructor: { include: { user: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
