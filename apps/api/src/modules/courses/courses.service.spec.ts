import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AccessControlService } from '../../common/services/access-control.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StudentsRepository } from '../students/students.repository';
import { CoursesRepository } from './courses.repository';
import { CoursesService } from './courses.service';

describe('CoursesService instructor scope', () => {
  const coursesRepository = {
    findById: jest.fn(),
    findAttachmentById: jest.fn(),
    listCourses: jest.fn(),
    countCourses: jest.fn(),
  };
  const studentsRepository = {};
  const storageService = {};
  const accessControl = {
    assertStudentUnlocked: jest.fn(),
    assertInstructorAssignedToCourse: jest.fn(),
    listInstructorAssignedCourseIds: jest.fn(),
  };
  const notificationsService = {};

  const service = new CoursesService(
    coursesRepository as unknown as CoursesRepository,
    studentsRepository as unknown as StudentsRepository,
    storageService as unknown as StorageService,
    accessControl as unknown as AccessControlService,
    notificationsService as unknown as NotificationsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists only assigned courses for instructors', async () => {
    accessControl.listInstructorAssignedCourseIds.mockResolvedValue([
      'course-1',
    ]);
    coursesRepository.listCourses.mockResolvedValue([
      { id: 'course-1', title: 'Assigned course' },
    ]);

    await expect(
      service.listCourses('user-1', Role.INSTRUCTOR),
    ).resolves.toEqual([{ id: 'course-1', title: 'Assigned course' }]);

    expect(coursesRepository.listCourses).toHaveBeenCalledWith({
      id: { in: ['course-1'] },
    });
  });

  it('rejects instructor reading unassigned course detail', async () => {
    coursesRepository.findById.mockResolvedValue({
      id: 'course-1',
      monthNumber: 1,
      status: 'PUBLISHED',
    });
    accessControl.assertInstructorAssignedToCourse.mockRejectedValue(
      new ForbiddenException('Not assigned to this course'),
    );

    await expect(
      service.getCourse('user-1', Role.INSTRUCTOR, 'course-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects instructor downloading attachment from unassigned course', async () => {
    coursesRepository.findAttachmentById.mockResolvedValue({
      objectKey: 'modules/file.pdf',
      mimeType: 'application/pdf',
      originalName: 'file.pdf',
      module: { course: { id: 'course-1', monthNumber: 1 } },
    });
    accessControl.assertInstructorAssignedToCourse.mockRejectedValue(
      new ForbiddenException('Not assigned to this course'),
    );

    await expect(
      service.getAttachmentForDownload(
        'user-1',
        Role.INSTRUCTOR,
        'attachment-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
