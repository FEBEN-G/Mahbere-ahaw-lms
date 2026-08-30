import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { computeUnlockedMonth } from '../../common/utils/drip-unlock.util';
import { getPublishedCoursesPerMonth } from '../../common/utils/program-policy';
import { AccessControlService } from '../../common/services/access-control.service';
import { StudentsRepository } from './students.repository';

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentsRepository: StudentsRepository,
    private readonly accessControl: AccessControlService,
  ) {}
  /**
   * Returns the authenticated student's enrollment and drip unlock state.
   */
  async getMyProfile(userId: string) {
    const profile = await this.studentsRepository.findByUserId(userId);
    if (!profile?.enrollment) {
      throw new NotFoundException('Student profile not found');
    }

    const unlockedMonth = computeUnlockedMonth(
      profile.enrollment.cohortStartedAt,
    );

    return {
      studentProfileId: profile.id,
      studentCode: profile.studentCode,
      user: profile.user,
      enrollment: {
        id: profile.enrollment.id,
        cohortStartedAt: profile.enrollment.cohortStartedAt,
        isActive: profile.enrollment.isActive,
        unlockedMonth,
        currentMonthCourseSlotHint: getPublishedCoursesPerMonth(),
      },
    };
  }

  async getUnlockedMonthForUser(userId: string): Promise<number> {
    const enrollment =
      await this.studentsRepository.findEnrollmentByUserId(userId);

    if (!enrollment) {
      throw new NotFoundException('Active enrollment not found');
    }

    return computeUnlockedMonth(enrollment.cohortStartedAt);
  }

  async recordAttachmentProgress(userId: string, attachmentId: string) {
    const profile = await this.studentsRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    const attachment =
      await this.studentsRepository.findAttachmentWithCourse(attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.accessControl.assertStudentUnlocked(
      userId,
      attachment.module.course.monthNumber,
    );

    return this.studentsRepository.recordAttachmentProgress(
      profile.id,
      attachmentId,
    ).then(() => ({ ok: true as const }));
  }
}
