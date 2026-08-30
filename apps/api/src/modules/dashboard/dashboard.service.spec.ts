import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

describe('DashboardService admin metrics', () => {
  it('assembles chart series and pipeline', async () => {
    const repository = {
      countActiveStudents: jest.fn().mockResolvedValue(10),
      countActiveInstructors: jest.fn().mockResolvedValue(2),
      countPublishedCourses: jest.fn().mockResolvedValue(4),
      countPendingSubmissions: jest.fn().mockResolvedValue(3),
      countPublishedGrades: jest.fn().mockResolvedValue(8),
      countSubmissionsByStatus: jest.fn().mockResolvedValue([
        { status: 'SUBMITTED', _count: { _all: 5 } },
        { status: 'LATE', _count: { _all: 1 } },
        { status: 'GRADED', _count: { _all: 7 } },
      ]),
      countCoursesByMonth: jest.fn().mockResolvedValue([
        { monthNumber: 1, status: 'PUBLISHED', _count: { _all: 2 } },
        { monthNumber: 1, status: 'DRAFT', _count: { _all: 1 } },
      ]),
      dailySubmissionCounts: jest
        .fn()
        .mockResolvedValue([{ date: '2026-08-01', count: 2 }]),
      dailyPublishedGradeCounts: jest
        .fn()
        .mockResolvedValue([{ date: '2026-08-01', count: 1 }]),
      dailyEnrollmentCounts: jest
        .fn()
        .mockResolvedValue([{ date: '2026-08-01', count: 0 }]),
      countGradesPublishedSince: jest.fn().mockResolvedValue(4),
    };

    const service = new DashboardService(
      {} as never,
      repository as unknown as DashboardRepository,
      {} as never,
      {} as never,
      {} as never,
    );

    const metrics = await service.getAdminMetrics(14);

    expect(metrics.summary.students).toBe(10);
    expect(metrics.summary.gradedThisWeek).toBe(4);
    expect(metrics.submissionPipeline.submitted).toBe(5);
    expect(metrics.coursesByMonth[0]).toEqual({
      monthNumber: 1,
      published: 2,
      draft: 1,
      total: 3,
    });
    expect(metrics.series.submissions).toHaveLength(1);
  });
});
