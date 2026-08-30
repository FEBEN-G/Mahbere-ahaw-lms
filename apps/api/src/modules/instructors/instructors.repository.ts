import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InstructorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.instructorProfile.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: { deletedAt: null, isActive: true },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        courseAssignments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                monthNumber: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }
}
