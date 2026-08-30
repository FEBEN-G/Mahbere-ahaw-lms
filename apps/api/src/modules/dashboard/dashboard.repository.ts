import { Injectable } from '@nestjs/common';
import {
  CourseStatus,
  GradeStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface DailyMetricPoint {
  date: string;
  count: number;
}

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActiveStudents() {
    return this.prisma.user.count({
      where: { role: Role.STUDENT, deletedAt: null, isActive: true },
    });
  }

  countActiveInstructors() {
    return this.prisma.user.count({
      where: { role: Role.INSTRUCTOR, deletedAt: null, isActive: true },
    });
  }

  countPublishedCourses() {
    return this.prisma.course.count({
      where: { deletedAt: null, status: CourseStatus.PUBLISHED },
    });
  }

  countPendingSubmissions(courseIds?: string[]) {
    if (courseIds) {
      if (courseIds.length === 0) {
        return Promise.resolve(0);
      }
      return this.prisma.submission.count({
        where: {
          deletedAt: null,
          grade: null,
          assignment: {
            deletedAt: null,
            courseId: { in: courseIds },
            course: { deletedAt: null },
          },
        },
      });
    }

    return this.prisma.submission.count({
      where: {
        deletedAt: null,
        grade: null,
      },
    });
  }

  countPublishedGrades() {
    return this.prisma.grade.count({
      where: { deletedAt: null, status: GradeStatus.PUBLISHED },
    });
  }

  countSubmissionsByStatus() {
    return this.prisma.submission.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
  }

  countCoursesByMonth() {
    return this.prisma.course.groupBy({
      by: ['monthNumber', 'status'],
      where: { deletedAt: null },
      _count: { _all: true },
      orderBy: { monthNumber: 'asc' },
    });
  }

  async dailySubmissionCounts(days: number): Promise<DailyMetricPoint[]> {
    const since = this.startOfDaysAgo(days);
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT date_trunc('day', "submittedAt") AS day, COUNT(*)::bigint AS count
      FROM submissions
      WHERE "deletedAt" IS NULL AND "submittedAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return this.fillDailySeries(days, rows);
  }

  async dailyPublishedGradeCounts(days: number): Promise<DailyMetricPoint[]> {
    const since = this.startOfDaysAgo(days);
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT date_trunc('day', "publishedAt") AS day, COUNT(*)::bigint AS count
      FROM grades
      WHERE "deletedAt" IS NULL
        AND status = 'PUBLISHED'
        AND "publishedAt" IS NOT NULL
        AND "publishedAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return this.fillDailySeries(days, rows);
  }

  async dailyEnrollmentCounts(days: number): Promise<DailyMetricPoint[]> {
    const since = this.startOfDaysAgo(days);
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM enrollments
      WHERE "deletedAt" IS NULL AND "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return this.fillDailySeries(days, rows);
  }

  countGradesPublishedSince(since: Date) {
    return this.prisma.grade.count({
      where: {
        deletedAt: null,
        status: GradeStatus.PUBLISHED,
        publishedAt: { gte: since },
      },
    });
  }

  private startOfDaysAgo(days: number): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1));
    return date;
  }

  private fillDailySeries(
    days: number,
    rows: Array<{ day: Date; count: bigint }>,
  ): DailyMetricPoint[] {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = this.toDateKey(new Date(row.day));
      map.set(key, Number(row.count));
    }

    const series: DailyMetricPoint[] = [];
    const cursor = this.startOfDaysAgo(days);
    for (let i = 0; i < days; i += 1) {
      const key = this.toDateKey(cursor);
      series.push({ date: key, count: map.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return series;
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
