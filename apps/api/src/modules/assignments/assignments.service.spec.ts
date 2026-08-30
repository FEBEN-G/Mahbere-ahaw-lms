import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AccessControlService } from '../../common/services/access-control.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { CoursesRepository } from '../courses/courses.repository';
import { StudentsRepository } from '../students/students.repository';
import { AssignmentsRepository } from './assignments.repository';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsService instructor scope', () => {
  const assignmentsRepository = {
    listByCourse: jest.fn(),
    findById: jest.fn(),
  };
  const coursesRepository = { findById: jest.fn() };
  const studentsRepository = {};
  const storageService = {};
  const accessControl = {
    assertStudentUnlocked: jest.fn(),
    assertInstructorAssignedToCourse: jest.fn(),
  };

  const service = new AssignmentsService(
    assignmentsRepository as unknown as AssignmentsRepository,
    coursesRepository as unknown as CoursesRepository,
    studentsRepository as unknown as StudentsRepository,
    storageService as unknown as StorageService,
    accessControl as unknown as AccessControlService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects instructor listing assignments for unassigned course', async () => {
    coursesRepository.findById.mockResolvedValue({
      id: 'course-1',
      monthNumber: 1,
    });
    accessControl.assertInstructorAssignedToCourse.mockRejectedValue(
      new ForbiddenException('Not assigned to this course'),
    );

    await expect(
      service.listByCourse('user-1', Role.INSTRUCTOR, 'course-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(assignmentsRepository.listByCourse).not.toHaveBeenCalled();
  });

  it('rejects instructor reading assignment for unassigned course', async () => {
    assignmentsRepository.findById.mockResolvedValue({
      id: 'asg-1',
      courseId: 'course-1',
      course: { monthNumber: 1 },
    });
    accessControl.assertInstructorAssignedToCourse.mockRejectedValue(
      new ForbiddenException('Not assigned to this course'),
    );

    await expect(
      service.getById('user-1', Role.INSTRUCTOR, 'asg-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
