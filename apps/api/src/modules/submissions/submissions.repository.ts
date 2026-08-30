import { Injectable } from '@nestjs/common';
import { GradeStatus, Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubmissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAssignmentAndStudent(assignmentId: string, studentId: string) {
    return this.prisma.submission.findFirst({
      where: { assignmentId, studentId, deletedAt: null },
      include: { grade: true },
    });
  }

  upsertSubmission(input: {
    assignmentId: string;
    studentId: string;
    objectKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    status: SubmissionStatus;
  }) {
    return this.prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: input.assignmentId,
          studentId: input.studentId,
        },
      },
      update: {
        objectKey: input.objectKey,
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        status: input.status,
        submittedAt: new Date(),
        deletedAt: null,
      },
      create: {
        assignmentId: input.assignmentId,
        studentId: input.studentId,
        objectKey: input.objectKey,
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        status: input.status,
      },
      include: { grade: true },
    });
  }

  findById(id: string) {
    return this.prisma.submission.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignment: { include: { course: true } },
        student: { include: { user: true } },
        grade: true,
      },
    });
  }

  listByAssignment(assignmentId: string) {
    return this.prisma.submission.findMany({
      where: { assignmentId, deletedAt: null },
      include: {
        student: { include: { user: true } },
        grade: true,
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            dueAt: true,
            course: {
              select: { id: true, title: true, monthNumber: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  listForStudent(studentId: string) {
    return this.prisma.submission.findMany({
      where: { studentId, deletedAt: null },
      include: {
        assignment: { include: { course: true } },
        grade: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  countPending() {
    return this.prisma.submission.count({
      where: {
        deletedAt: null,
        grade: null,
      },
    });
  }

  countPendingForCourseIds(courseIds: string[]) {
    if (courseIds.length === 0) {
      return Promise.resolve(0);
    }

    return this.prisma.submission.count({
      where: {
        deletedAt: null,
        grade: null,
        assignment: {
          deletedAt: null,
          courseId: { in: courseIds },
          course: { deletedAt: null },
        },
      },
    });
  }

  countPublishedGradesForInstructorSince(instructorId: string, since: Date) {
    return this.prisma.grade.count({
      where: {
        deletedAt: null,
        status: GradeStatus.PUBLISHED,
        instructorId,
        publishedAt: { gte: since },
      },
    });
  }
}

export type SubmissionWithRelations = Prisma.SubmissionGetPayload<{
  include: {
    assignment: { include: { course: true } };
    student: { include: { user: true } };
    grade: true;
  };
}>;
