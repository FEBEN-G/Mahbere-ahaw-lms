import { Injectable } from '@nestjs/common';
import { AttachmentType, CourseStatus, SubmissionStatus } from '@prisma/client';import { computeUnlockedMonth } from '../../common/utils/drip-unlock.util';
import { getPublishedCoursesPerMonth } from '../../common/utils/program-policy';
import { PrismaService } from '../../prisma/prisma.service';
import { GradingRepository } from '../grading/grading.repository';
import { StudentsRepository } from '../students/students.repository';
import { SubmissionsRepository } from '../submissions/submissions.repository';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardRepository: DashboardRepository,
    private readonly studentsRepository: StudentsRepository,
    private readonly submissionsRepository: SubmissionsRepository,
    private readonly gradingRepository: GradingRepository,
  ) {}

  async getAdminSummary() {
    const [
      students,
      instructors,
      publishedCourses,
      pendingSubmissions,
      gradedCount,
    ] = await Promise.all([
      this.dashboardRepository.countActiveStudents(),
      this.dashboardRepository.countActiveInstructors(),
      this.dashboardRepository.countPublishedCourses(),
      this.dashboardRepository.countPendingSubmissions(),
      this.dashboardRepository.countPublishedGrades(),
    ]);

    return {
      students,
      instructors,
      publishedCourses,
      pendingSubmissions,
      gradedCount,
    };
  }

  async getAdminMetrics(days = 14) {
    const windowDays = Math.min(Math.max(days, 7), 90);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      summary,
      submissionStatusRows,
      courseMonthRows,
      submissionsOverTime,
      gradesOverTime,
      enrollmentsOverTime,
      gradedThisWeek,
    ] = await Promise.all([
      this.getAdminSummary(),
      this.dashboardRepository.countSubmissionsByStatus(),
      this.dashboardRepository.countCoursesByMonth(),
      this.dashboardRepository.dailySubmissionCounts(windowDays),
      this.dashboardRepository.dailyPublishedGradeCounts(windowDays),
      this.dashboardRepository.dailyEnrollmentCounts(windowDays),
      this.dashboardRepository.countGradesPublishedSince(weekAgo),
    ]);

    const submissionPipeline = {
      submitted: 0,
      late: 0,
      graded: 0,
      returned: 0,
    };
    for (const row of submissionStatusRows) {
      if (row.status === SubmissionStatus.SUBMITTED) {
        submissionPipeline.submitted = row._count._all;
      } else if (row.status === SubmissionStatus.LATE) {
        submissionPipeline.late = row._count._all;
      } else if (row.status === SubmissionStatus.GRADED) {
        submissionPipeline.graded = row._count._all;
      } else if (row.status === SubmissionStatus.RETURNED) {
        submissionPipeline.returned = row._count._all;
      }
    }

    const monthRelease = new Map<
      number,
      { monthNumber: number; published: number; draft: number; total: number }
    >();
    for (const row of courseMonthRows) {
      const current = monthRelease.get(row.monthNumber) ?? {
        monthNumber: row.monthNumber,
        published: 0,
        draft: 0,
        total: 0,
      };
      if (row.status === CourseStatus.PUBLISHED) {
        current.published += row._count._all;
      } else {
        current.draft += row._count._all;
      }
      current.total += row._count._all;
      monthRelease.set(row.monthNumber, current);
    }

    return {
      generatedAt: new Date().toISOString(),
      windowDays,
      summary: {
        ...summary,
        gradedThisWeek,
      },
      submissionPipeline,
      coursesByMonth: [...monthRelease.values()].sort(
        (a, b) => a.monthNumber - b.monthNumber,
      ),
      series: {
        submissions: submissionsOverTime,
        publishedGrades: gradesOverTime,
        enrollments: enrollmentsOverTime,
      },
    };
  }

  async getStudentSummary(userId: string) {
    const profile = await this.studentsRepository.findByUserId(userId);
    if (!profile?.enrollment) {
      return null;
    }

    const unlockedMonth = computeUnlockedMonth(
      profile.enrollment.cohortStartedAt,
    );

    const currentMonthCourses = await this.prisma.course.findMany({
      where: {
        deletedAt: null,
        status: CourseStatus.PUBLISHED,
        monthNumber: unlockedMonth,
      },
      orderBy: { createdAt: 'asc' },
      take: getPublishedCoursesPerMonth(),
      include: {
        modules: {
          where: { deletedAt: null },
          include: {
            attachments: {
              where: { deletedAt: null },
            },
          },
        },
        assignments: {
          where: { deletedAt: null },
        },
      },
    });

    const courseIds = currentMonthCourses.map((course) => course.id);
    const readableAttachmentIds: string[] = [];
    let totalProgressItems = 0;

    for (const course of currentMonthCourses) {
      totalProgressItems += course.assignments.length;
      for (const courseModule of course.modules) {
        for (const attachment of courseModule.attachments) {
          if (attachment.type === AttachmentType.VIDEO_LINK) {
            continue;
          }
          totalProgressItems += 1;
          readableAttachmentIds.push(attachment.id);
        }
      }
    }

    const [attachmentProgress, submissions] = await Promise.all([
      this.studentsRepository.listAttachmentProgress(
        profile.id,
        readableAttachmentIds,
      ),
      courseIds.length === 0
        ? Promise.resolve([])
        : this.prisma.submission.findMany({
            where: {
              studentId: profile.id,
              deletedAt: null,
              assignment: {
                deletedAt: null,
                courseId: { in: courseIds },
              },
            },
            select: { assignmentId: true },
          }),
    ]);

    const completedProgressItems =
      attachmentProgress.length + submissions.length;
    const progressPercent =
      totalProgressItems === 0
        ? 0
        : Math.min(
            100,
            Math.round((completedProgressItems / totalProgressItems) * 100),
          );

    const courses = await this.prisma.course.count({
      where: {
        deletedAt: null,
        status: CourseStatus.PUBLISHED,
        monthNumber: { lte: unlockedMonth },
      },
    });

    const allSubmissions = await this.submissionsRepository.listForStudent(
      profile.id,
    );
    const grades = await this.gradingRepository.listPublishedForStudent(
      profile.id,
    );

    return {
      unlockedMonth,
      currentMonthCourses: currentMonthCourses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        monthNumber: course.monthNumber,
        moduleCount: course.modules.length,
        assignmentCount: course.assignments.length,
      })),
      progress: {
        completed: completedProgressItems,
        total: totalProgressItems,
        percent: progressPercent,
      },
      availableCourses: courses,
      submissionsCount: allSubmissions.length,
      publishedGradesCount: grades.length,
    };
  }

  async getInstructorSummary(userId: string) {
    const instructor = await this.prisma.instructorProfile.findFirst({
      where: { userId, deletedAt: null },
      include: {
        courseAssignments: true,
      },
    });

    if (!instructor) {
      return null;
    }

    const courseIds = instructor.courseAssignments.map(
      (assignment) => assignment.courseId,
    );
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [pendingSubmissions, gradedThisWeekCount] = await Promise.all([
      this.dashboardRepository.countPendingSubmissions(courseIds),
      this.prisma.grade.count({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          instructorId: instructor.id,
          publishedAt: { gte: weekAgo },
        },
      }),
    ]);

    return {
      assignedCourses: instructor.courseAssignments.length,
      pendingSubmissions,
      gradedThisWeekCount,
    };
  }
}
