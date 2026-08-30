import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StudentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.studentProfile.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: { deletedAt: null, isActive: true },
      },
      include: {
        enrollment: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  findEnrollmentByUserId(userId: string) {
    return this.prisma.enrollment.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        student: {
          userId,
          deletedAt: null,
        },
      },
    });
  }

  recordAttachmentProgress(studentProfileId: string, attachmentId: string) {
    return this.prisma.studentAttachmentProgress.upsert({
      where: {
        studentProfileId_attachmentId: {
          studentProfileId,
          attachmentId,
        },
      },
      update: { completedAt: new Date() },
      create: {
        studentProfileId,
        attachmentId,
      },
    });
  }

  listAttachmentProgress(studentProfileId: string, attachmentIds: string[]) {
    if (attachmentIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.studentAttachmentProgress.findMany({
      where: {
        studentProfileId,
        attachmentId: { in: attachmentIds },
      },
      select: { attachmentId: true },
    });
  }

  listActiveEnrollmentsForMonthAccess() {
    return this.prisma.enrollment.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        student: {
          deletedAt: null,
          user: { deletedAt: null, isActive: true },
        },
      },
      select: {
        cohortStartedAt: true,
        student: { select: { userId: true } },
      },
    });
  }

  findAttachmentWithCourse(attachmentId: string) {
    return this.prisma.attachment.findFirst({
      where: { id: attachmentId, deletedAt: null },
      include: {
        module: {
          include: {
            course: { select: { monthNumber: true, status: true } },
          },
        },
      },
    });
  }
}
