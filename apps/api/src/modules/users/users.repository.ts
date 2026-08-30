import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateStudentRecordInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  studentCode?: string;
  cohortStartedAt: Date;
  mustSetPassword?: boolean;
}

export interface CreateInstructorRecordInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  title?: string;
  mustSetPassword?: boolean;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        studentProfile: {
          include: { enrollment: true },
        },
        instructorProfile: true,
      },
    });
  }

  async list(input: {
    page: number;
    pageSize: number;
    role?: Role;
  }) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(input.role ? { role: input.role } : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          mustSetPassword: true,
          createdAt: true,
          studentProfile: {
            select: {
              id: true,
              studentCode: true,
              enrollment: {
                select: {
                  id: true,
                  cohortStartedAt: true,
                  isActive: true,
                },
              },
            },
          },
          instructorProfile: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return { total, items };
  }

  createStudentWithEnrollment(input: CreateStudentRecordInput) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: Role.STUDENT,
          mustSetPassword: input.mustSetPassword ?? false,
          studentProfile: {
            create: {
              studentCode: input.studentCode,
              enrollment: {
                create: {
                  cohortStartedAt: input.cohortStartedAt,
                  isActive: true,
                },
              },
            },
          },
        },
        include: {
          studentProfile: {
            include: { enrollment: true },
          },
        },
      });

      return user;
    });
  }

  createInstructor(input: CreateInstructorRecordInput) {
    return this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: Role.INSTRUCTOR,
        mustSetPassword: input.mustSetPassword ?? false,
        instructorProfile: {
          create: {
            title: input.title,
          },
        },
      },
      include: {
        instructorProfile: true,
      },
    });
  }

  setActive(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  setMustSetPassword(id: string, mustSetPassword: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { mustSetPassword },
    });
  }

  softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
