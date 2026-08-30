import { Injectable } from '@nestjs/common';
import {
  Assignment,
  Attachment,
  Course,
  Module,
  Prisma,
} from '@prisma/client';
import { withNotDeleted } from '../../common/utils/soft-delete.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  createCourse(data: Prisma.CourseCreateInput) {
    return this.prisma.course.create({ data });
  }

  updateCourse(id: string, data: Prisma.CourseUpdateInput) {
    return this.prisma.course.update({ where: { id }, data });
  }

  softDeleteCourseAggregate(id: string, updatedById: string) {
    const deletedAt = new Date();
    return this.prisma.$transaction(async (tx) => {
      const modules = await tx.module.findMany({
        where: { courseId: id, deletedAt: null },
        select: { id: true },
      });
      const moduleIds = modules.map((module) => module.id);

      if (moduleIds.length > 0) {
        await tx.attachment.updateMany({
          where: { moduleId: { in: moduleIds }, deletedAt: null },
          data: { deletedAt },
        });
        await tx.module.updateMany({
          where: { id: { in: moduleIds }, deletedAt: null },
          data: { deletedAt },
        });
      }

      await tx.assignment.updateMany({
        where: { courseId: id, deletedAt: null },
        data: { deletedAt },
      });

      return tx.course.update({
        where: { id },
        data: {
          deletedAt,
          updatedBy: { connect: { id: updatedById } },
        },
      });
    });
  }

  findById(id: string, includeDeleted = false) {
    return this.prisma.course.findFirst({
      where: withNotDeleted({ id }, includeDeleted),
      include: {
        modules: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            attachments: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        assignments: {
          where: { deletedAt: null },
          orderBy: { dueAt: 'asc' },
        },
        instructors: {
          include: {
            instructor: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  listCourses(
    where: Prisma.CourseWhereInput,
    options?: { page?: number; pageSize?: number },
  ) {
    const page = options?.page;
    const pageSize = options?.pageSize;
    const skip =
      page !== undefined && pageSize !== undefined
        ? (page - 1) * pageSize
        : undefined;
    const take = pageSize;

    return this.prisma.course.findMany({
      where: withNotDeleted(where as Record<string, unknown>),
      orderBy: [{ monthNumber: 'asc' }, { createdAt: 'asc' }],
      skip,
      take,
      include: {
        _count: {
          select: {
            modules: { where: { deletedAt: null } },
            assignments: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  countCourses(where: Prisma.CourseWhereInput) {
    return this.prisma.course.count({
      where: withNotDeleted(where as Record<string, unknown>),
    });
  }

  createModule(data: Prisma.ModuleCreateInput) {
    return this.prisma.module.create({ data });
  }

  createAttachment(data: Prisma.AttachmentCreateInput) {
    return this.prisma.attachment.create({ data });
  }

  findModuleById(id: string) {
    return this.prisma.module.findFirst({
      where: withNotDeleted({ id }),
      include: { course: true, attachments: { where: { deletedAt: null } } },
    });
  }

  findAttachmentById(id: string) {
    return this.prisma.attachment.findFirst({
      where: withNotDeleted({ id }),
      include: { module: { include: { course: true } } },
    });
  }

  assignInstructor(courseId: string, instructorProfileId: string) {
    return this.prisma.instructorCourseAssignment.upsert({
      where: {
        instructorId_courseId: {
          instructorId: instructorProfileId,
          courseId,
        },
      },
      update: {},
      create: {
        courseId,
        instructorId: instructorProfileId,
      },
    });
  }
}

export type CourseWithRelations = Course & {
  modules: (Module & { attachments: Attachment[] })[];
  assignments: Assignment[];
};
