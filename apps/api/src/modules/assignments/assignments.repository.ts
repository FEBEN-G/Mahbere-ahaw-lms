import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AssignmentCreateInput) {
    return this.prisma.assignment.create({ data });
  }

  findById(id: string) {
    return this.prisma.assignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: true,
        submissions: {
          where: { deletedAt: null },
          include: {
            student: { include: { user: true } },
            grade: true,
          },
        },
      },
    });
  }

  listByCourse(courseId: string) {
    return this.prisma.assignment.findMany({
      where: { courseId, deletedAt: null },
      include: { course: true },
      orderBy: { dueAt: 'asc' },
    });
  }

  listForStudent(courseIds: string[]) {
    return this.prisma.assignment.findMany({
      where: {
        deletedAt: null,
        courseId: { in: courseIds },
      },
      include: {
        course: true,
        submissions: true,
      },
      orderBy: { dueAt: 'asc' },
    });
  }
}
