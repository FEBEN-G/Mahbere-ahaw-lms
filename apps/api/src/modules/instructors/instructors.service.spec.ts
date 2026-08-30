import { InstructorsService } from './instructors.service';
import { InstructorsRepository } from './instructors.repository';
import { SubmissionsRepository } from '../submissions/submissions.repository';

describe('InstructorsService pending scope', () => {
  it('counts pending submissions only for assigned courses', async () => {
    const instructorsRepository = {
      findByUserId: jest.fn().mockResolvedValue({
        id: 'inst-1',
        title: 'Teacher',
        user: { id: 'user-1' },
        courseAssignments: [
          {
            course: {
              id: 'course-a',
              title: 'Theology',
              monthNumber: 1,
              status: 'PUBLISHED',
            },
          },
        ],
      }),
    };
    const submissionsRepository = {
      countPendingForCourseIds: jest.fn().mockResolvedValue(2),
      countPublishedGradesForInstructorSince: jest.fn().mockResolvedValue(1),
    };

    const service = new InstructorsService(
      instructorsRepository as unknown as InstructorsRepository,
      submissionsRepository as unknown as SubmissionsRepository,
    );

    const profile = await service.getMyProfile('user-1');

    expect(submissionsRepository.countPendingForCourseIds).toHaveBeenCalledWith([
      'course-a',
    ]);
    expect(profile.pendingSubmissionsCount).toBe(2);
    expect(profile.gradedThisWeekCount).toBe(1);
  });
});
