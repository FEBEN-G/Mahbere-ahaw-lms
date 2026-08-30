import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessControlService } from '../../common/services/access-control.service';
import { InstructorsRepository } from '../instructors/instructors.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { StudentsRepository } from '../students/students.repository';
import { SubmissionsRepository } from '../submissions/submissions.repository';
import { CreateGradeDto } from './dto/create-grade.dto';
import { GradingRepository } from './grading.repository';

@Injectable()
export class GradingService {
  constructor(
    private readonly gradingRepository: GradingRepository,
    private readonly submissionsRepository: SubmissionsRepository,
    private readonly instructorsRepository: InstructorsRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly accessControl: AccessControlService,
  ) {}

  async gradeSubmission(
    userId: string,
    submissionId: string,
    dto: CreateGradeDto,
  ) {
    const instructor = await this.instructorsRepository.findByUserId(userId);
    if (!instructor) {
      throw new NotFoundException('Instructor profile not found');
    }

    const submission = await this.submissionsRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    await this.accessControl.assertInstructorAssignedToCourse(
      userId,
      submission.assignment.courseId,
    );

    if (submission.grade?.status === 'PUBLISHED') {
      throw new BadRequestException('Published grades cannot be edited');
    }

    const maxScore = Number(submission.assignment.maxScore);
    if (Number.isFinite(maxScore) && dto.score > maxScore) {
      throw new BadRequestException(
        `Score cannot exceed the assignment maximum of ${maxScore}`,
      );
    }

    return this.gradingRepository.upsertGrade({
      submissionId,
      instructorId: instructor.id,
      score: dto.score,
      feedback: dto.feedback,
    });
  }

  async publishGrade(userId: string, gradeId: string) {
    const instructor = await this.instructorsRepository.findByUserId(userId);
    if (!instructor) {
      throw new NotFoundException('Instructor profile not found');
    }

    const existing = await this.gradingRepository.findById(gradeId);
    if (!existing) {
      throw new NotFoundException('Grade not found');
    }

    const submission = await this.submissionsRepository.findById(
      existing.submissionId,
    );
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    await this.accessControl.assertInstructorAssignedToCourse(
      userId,
      submission.assignment.courseId,
    );

    const grade = await this.gradingRepository.publishGrade(
      gradeId,
      instructor.id,
    );

    if (submission.student.userId) {
      await this.notificationsService.notifyUser({
        userId: submission.student.userId,
        title: 'Grade published',
        body: `Your grade for "${submission.assignment.title}" is now available.`,
        eventType: 'GRADE_PUBLISHED',
        payload: { gradeId: grade.id, submissionId: submission.id },
      });
    }

    return grade;
  }

  async listMyGrades(userId: string) {
    const profile = await this.studentsRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    return this.gradingRepository.listPublishedForStudent(profile.id);
  }

  async listGradebook(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.gradingRepository.listAllForGradebook({ page, pageSize }),
      this.gradingRepository.countGradebook(),
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }
}
