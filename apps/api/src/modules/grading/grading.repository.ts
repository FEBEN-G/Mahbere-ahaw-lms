import { Injectable } from '@nestjs/common';
import { GradeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GradingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.grade.findFirst({
      where: { id, deletedAt: null },
    });
  }

  upsertGrade(input: {
    submissionId: string;
    instructorId: string;
    score: Prisma.Decimal | number;
    feedback?: string;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const grade = await transaction.grade.upsert({
        where: { submissionId: input.submissionId },
        update: {
          score: input.score,
          feedback: input.feedback,
          instructorId: input.instructorId,
        },
        create: {
          submissionId: input.submissionId,
          instructorId: input.instructorId,
          score: input.score,
          feedback: input.feedback,
          status: GradeStatus.DRAFT,
        },
      });

      await transaction.gradeHistory.create({
        data: {
          gradeId: grade.id,
          score: grade.score,
          feedback: grade.feedback,
          status: grade.status,
          changedBy: input.instructorId,
          reason: 'Grade saved',
        },
      });

      return grade;
    });
  }

  publishGrade(gradeId: string, instructorId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const grade = await transaction.grade.update({
        where: { id: gradeId },
        data: {
          status: GradeStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });

      await transaction.submission.update({
        where: { id: grade.submissionId },
        data: { status: 'GRADED' },
      });

      await transaction.gradeHistory.create({
        data: {
          gradeId: grade.id,
          score: grade.score,
          feedback: grade.feedback,
          status: GradeStatus.PUBLISHED,
          changedBy: instructorId,
          reason: 'Grade published',
        },
      });

      return grade;
    });
  }

  listPublishedForStudent(studentId: string) {
    return this.prisma.grade.findMany({
      where: {
        status: GradeStatus.PUBLISHED,
        deletedAt: null,
        submission: { studentId, deletedAt: null },
      },
      include: {
        submission: {
          include: {
            assignment: { include: { course: true } },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  listAllForGradebook(options?: { page?: number; pageSize?: number }) {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

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
      skip,
      take: pageSize,
    });
  }

  countGradebook() {
    return this.prisma.grade.count({ where: { deletedAt: null } });
  }
}
