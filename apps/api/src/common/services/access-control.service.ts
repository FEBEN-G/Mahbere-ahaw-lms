import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { canAccessCourseMonth } from '../utils/drip-unlock.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  async assertStudentUnlocked(userId: string, monthNumber: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        student: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (
      !enrollment ||
      !canAccessCourseMonth(monthNumber, enrollment.cohortStartedAt)
    ) {
      throw new ForbiddenException('Course month is locked');
    }

    return enrollment;
  }

  async assertInstructorAssignedToCourse(userId: string, courseId: string) {
    const instructor = await this.prisma.instructorProfile.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: { deletedAt: null, isActive: true },
      },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor profile not found');
    }

    const assignment = await this.prisma.instructorCourseAssignment.findFirst({
      where: {
        instructorId: instructor.id,
        courseId,
      },
    });

    if (!assignment) {
      throw new ForbiddenException('Not assigned to this course');
    }

    return instructor;
  }

  async listInstructorAssignedCourseIds(userId: string): Promise<string[]> {
    const instructor = await this.prisma.instructorProfile.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: { deletedAt: null, isActive: true },
      },
      select: { id: true },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor profile not found');
    }

    const assignments = await this.prisma.instructorCourseAssignment.findMany({
      where: { instructorId: instructor.id },
      select: { courseId: true },
    });

    return assignments.map((assignment) => assignment.courseId);
  }
}
