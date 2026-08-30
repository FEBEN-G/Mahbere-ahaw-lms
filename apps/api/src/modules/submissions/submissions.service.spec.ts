import { ForbiddenException } from '@nestjs/common';
import { AccessControlService } from '../../common/services/access-control.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AssignmentsRepository } from '../assignments/assignments.repository';
import { StudentsRepository } from '../students/students.repository';
import { SubmissionsRepository } from './submissions.repository';
import { SubmissionsService } from './submissions.service';

describe('SubmissionsService drip-on-submit', () => {
  const submissionsRepository = {
    upsertSubmission: jest.fn(),
    findByAssignmentAndStudent: jest.fn(),
  };
  const assignmentsRepository = { findById: jest.fn() };
  const studentsRepository = { findByUserId: jest.fn() };
  const storageService = { saveUploadedFile: jest.fn() };
  const accessControl = { assertStudentUnlocked: jest.fn() };

  const service = new SubmissionsService(
    submissionsRepository as unknown as SubmissionsRepository,
    assignmentsRepository as unknown as AssignmentsRepository,
    studentsRepository as unknown as StudentsRepository,
    storageService as unknown as StorageService,
    accessControl as unknown as AccessControlService,
  );

  it('rejects submit when course month is locked', async () => {
    studentsRepository.findByUserId.mockResolvedValue({ id: 'stu-1' });
    assignmentsRepository.findById.mockResolvedValue({
      id: 'asg-1',
      dueAt: new Date(Date.now() + 86_400_000),
      course: { monthNumber: 4 },
    });
    accessControl.assertStudentUnlocked.mockRejectedValue(
      new ForbiddenException('Course month is locked'),
    );

    await expect(
      service.submit('user-1', 'asg-1', {
        buffer: Buffer.from('x'),
        originalname: 'a.pdf',
        mimetype: 'application/pdf',
        size: 1,
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(storageService.saveUploadedFile).not.toHaveBeenCalled();
  });

  it('rejects duplicate file upload for the same assignment', async () => {
    const file = {
      buffer: Buffer.from('x'),
      originalname: 'homework.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    studentsRepository.findByUserId.mockResolvedValue({ id: 'stu-1' });
    assignmentsRepository.findById.mockResolvedValue({
      id: 'asg-1',
      dueAt: new Date(Date.now() + 86_400_000),
      course: { monthNumber: 1 },
    });
    accessControl.assertStudentUnlocked.mockResolvedValue(undefined);
    submissionsRepository.findByAssignmentAndStudent.mockResolvedValue({
      originalName: 'homework.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      grade: null,
    });

    await expect(service.submit('user-1', 'asg-1', file)).rejects.toThrow(
      'File already uploaded',
    );

    expect(storageService.saveUploadedFile).not.toHaveBeenCalled();
    expect(submissionsRepository.upsertSubmission).not.toHaveBeenCalled();
  });
});
