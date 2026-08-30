import { ForbiddenException } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AccessControlService', () => {
  const prisma = {
    enrollment: { findFirst: jest.fn() },
    instructorProfile: { findFirst: jest.fn() },
    instructorCourseAssignment: { findFirst: jest.fn(), findMany: jest.fn() },
  };

  const service = new AccessControlService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects locked month for students', async () => {
    prisma.enrollment.findFirst.mockResolvedValue({
      cohortStartedAt: new Date(),
    });

    await expect(
      service.assertStudentUnlocked('user-1', 3),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects instructor not assigned to course', async () => {
    prisma.instructorProfile.findFirst.mockResolvedValue({ id: 'inst-1' });
    prisma.instructorCourseAssignment.findFirst.mockResolvedValue(null);

    await expect(
      service.assertInstructorAssignedToCourse('user-1', 'course-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns assigned course ids for instructor', async () => {
    prisma.instructorProfile.findFirst.mockResolvedValue({ id: 'inst-1' });
    prisma.instructorCourseAssignment.findMany.mockResolvedValue([
      { courseId: 'course-1' },
      { courseId: 'course-2' },
    ]);

    await expect(
      service.listInstructorAssignedCourseIds('user-1'),
    ).resolves.toEqual(['course-1', 'course-2']);
  });
});
