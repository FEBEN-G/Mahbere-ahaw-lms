import { Injectable, NotFoundException } from '@nestjs/common';
import { SubmissionsRepository } from '../submissions/submissions.repository';
import { InstructorsRepository } from './instructors.repository';

@Injectable()
export class InstructorsService {
  constructor(
    private readonly instructorsRepository: InstructorsRepository,
    private readonly submissionsRepository: SubmissionsRepository,
  ) {}

  async getMyProfile(userId: string) {
    const profile = await this.instructorsRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    const assignedCourses = profile.courseAssignments.map((assignment) => ({
      id: assignment.course.id,
      title: assignment.course.title,
      monthNumber: assignment.course.monthNumber,
      status: assignment.course.status,
    }));

    const courseIds = assignedCourses.map((course) => course.id);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [pendingSubmissionsCount, gradedThisWeekCount] = await Promise.all([
      this.submissionsRepository.countPendingForCourseIds(courseIds),
      this.submissionsRepository.countPublishedGradesForInstructorSince(
        profile.id,
        weekAgo,
      ),
    ]);

    return {
      instructorProfileId: profile.id,
      title: profile.title,
      user: profile.user,
      assignedCourses,
      pendingSubmissionsCount,
      gradedThisWeekCount,
    };
  }
}
