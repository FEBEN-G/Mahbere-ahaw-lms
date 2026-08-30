import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccessControlService } from '../../common/services/access-control.service';
import { InstructorsRepository } from '../instructors/instructors.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { StudentsRepository } from '../students/students.repository';
import { SubmissionsRepository } from '../submissions/submissions.repository';
import { GradingRepository } from './grading.repository';
import { GradingService } from './grading.service';

describe('GradingService instructor scoping', () => {
  const gradingRepository = {
    upsertGrade: jest.fn(),
    findById: jest.fn(),
    publishGrade: jest.fn(),
  };
  const submissionsRepository = {
    findById: jest.fn(),
  };
  const instructorsRepository = {
    findByUserId: jest.fn(),
  };
  const studentsRepository = {};
  const notificationsService = { notifyUser: jest.fn() };
  const accessControl = {
    assertInstructorAssignedToCourse: jest.fn(),
  };

  const service = new GradingService(
    gradingRepository as unknown as GradingRepository,
    submissionsRepository as unknown as SubmissionsRepository,
    instructorsRepository as unknown as InstructorsRepository,
    studentsRepository as unknown as StudentsRepository,
    notificationsService as unknown as NotificationsService,
    accessControl as unknown as AccessControlService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('denies grading when instructor is not assigned to the course', async () => {
    instructorsRepository.findByUserId.mockResolvedValue({ id: 'inst-1' });
    submissionsRepository.findById.mockResolvedValue({
      id: 'sub-1',
      assignment: { courseId: 'course-b' },
      grade: null,
    });
    accessControl.assertInstructorAssignedToCourse.mockRejectedValue(
      new ForbiddenException('Not assigned to this course'),
    );

    await expect(
      service.gradeSubmission('user-1', 'sub-1', { score: 90 }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(gradingRepository.upsertGrade).not.toHaveBeenCalled();
  });

  it('grades when instructor is assigned', async () => {
    instructorsRepository.findByUserId.mockResolvedValue({ id: 'inst-1' });
    submissionsRepository.findById.mockResolvedValue({
      id: 'sub-1',
      assignment: { courseId: 'course-a' },
      grade: null,
    });
    accessControl.assertInstructorAssignedToCourse.mockResolvedValue({
      id: 'inst-1',
    });
    gradingRepository.upsertGrade.mockResolvedValue({ id: 'grade-1' });

    const result = await service.gradeSubmission('user-1', 'sub-1', {
      score: 88,
    });

    expect(result).toEqual({ id: 'grade-1' });
    expect(accessControl.assertInstructorAssignedToCourse).toHaveBeenCalledWith(
      'user-1',
      'course-a',
    );
  });

  it('throws when instructor profile missing', async () => {
    instructorsRepository.findByUserId.mockResolvedValue(null);
    await expect(
      service.gradeSubmission('user-1', 'sub-1', { score: 10 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
