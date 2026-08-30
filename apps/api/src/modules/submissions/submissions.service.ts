import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, SubmissionStatus } from '@prisma/client';
import { AccessControlService } from '../../common/services/access-control.service';
import {
  isDuplicateUpload,
  validateUploadFile,
} from '../../common/utils/file-validation.util';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AssignmentsRepository } from '../assignments/assignments.repository';
import { StudentsRepository } from '../students/students.repository';
import { SubmissionsRepository } from './submissions.repository';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly submissionsRepository: SubmissionsRepository,
    private readonly assignmentsRepository: AssignmentsRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly storageService: StorageService,
    private readonly accessControl: AccessControlService,
  ) {}

  async submit(
    userId: string,
    assignmentId: string,
    file: Express.Multer.File,
  ) {
    validateUploadFile(file);
    const profile = await this.studentsRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    const assignment = await this.assignmentsRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    await this.accessControl.assertStudentUnlocked(
      userId,
      assignment.course.monthNumber,
    );

    const now = new Date();
    const isLate = now.getTime() > assignment.dueAt.getTime();
    const existing = await this.submissionsRepository.findByAssignmentAndStudent(
      assignmentId,
      profile.id,
    );

    if (existing?.grade?.status === 'PUBLISHED') {
      throw new BadRequestException('Graded submission cannot be replaced');
    }

    if (existing && now.getTime() > assignment.dueAt.getTime()) {
      throw new BadRequestException('Deadline passed; submission locked');
    }

    if (
      existing &&
      isDuplicateUpload(file, {
        originalName: existing.originalName,
        mimeType: existing.mimeType,
        sizeBytes: existing.sizeBytes,
      })
    ) {
      throw new BadRequestException('File already uploaded');
    }

    const stored = await this.storageService.saveUploadedFile(
      file,
      `submissions/${assignmentId}/${profile.id}`,
    );

    return this.submissionsRepository.upsertSubmission({
      assignmentId,
      studentId: profile.id,
      objectKey: stored.objectKey,
      originalName: stored.originalName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
    });
  }

  async listMine(userId: string) {
    const profile = await this.studentsRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }
    return this.submissionsRepository.listForStudent(profile.id);
  }

  async listForAssignment(
    userId: string,
    role: Role,
    assignmentId: string,
  ) {
    const assignment = await this.assignmentsRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (role === Role.INSTRUCTOR) {
      await this.accessControl.assertInstructorAssignedToCourse(
        userId,
        assignment.courseId,
      );
    }

    return this.submissionsRepository.listByAssignment(assignmentId);
  }

  async getDownload(userId: string, role: Role, submissionId: string) {
    const submission = await this.submissionsRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (role === Role.STUDENT) {
      const profile = await this.studentsRepository.findByUserId(userId);
      if (profile?.id !== submission.studentId) {
        throw new ForbiddenException('Not your submission');
      }
    }

    if (role === Role.INSTRUCTOR) {
      await this.accessControl.assertInstructorAssignedToCourse(
        userId,
        submission.assignment.courseId,
      );
    }

    if (!(await this.storageService.fileExists(submission.objectKey))) {
      throw new NotFoundException('File not found');
    }

    return {
      stream: await this.storageService.createReadStream(submission.objectKey),
      mimeType: submission.mimeType,
      originalName: submission.originalName,
    };
  }
}
