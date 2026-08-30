import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { computeUnlockedMonth } from '../../common/utils/drip-unlock.util';
import { getDripDaysPerMonth } from '../../common/utils/program-policy';
import { QUEUE_NAMES } from '../../infrastructure/queues/queue.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const ENROLLMENT_BATCH_SIZE = 100;

@Processor(QUEUE_NAMES.CONTENT_RELEASE)
export class ContentReleaseProcessor extends WorkerHost {
  private readonly logger = new Logger(ContentReleaseProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error({
      msg: 'job_failed',
      queue: QUEUE_NAMES.CONTENT_RELEASE,
      jobId: job?.id,
      jobName: job?.name,
      attemptsMade: job?.attemptsMade,
      error: error.message,
    });
  }

  async process(job: Job) {
    switch (job.name) {
      case 'scan-drip-unlocks':
        return this.processDripUnlocks();
      case 'scan-assignment-reminders':
        return this.processAssignmentReminders();
      default:
        this.logger.warn(`Unknown content-release job: ${job.name}`);
    }
  }

  private async processDripUnlocks() {
    let cursor: string | undefined;
    let processed = 0;

    for (;;) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { isActive: true, deletedAt: null },
        include: { student: true },
        orderBy: { id: 'asc' },
        take: ENROLLMENT_BATCH_SIZE,
        ...(cursor
          ? { skip: 1, cursor: { id: cursor } }
          : {}),
      });

      if (enrollments.length === 0) {
        break;
      }

      for (const enrollment of enrollments) {
        const unlockedMonth = computeUnlockedMonth(enrollment.cohortStartedAt);
        try {
          await this.prisma.contentReleaseCursor.create({
            data: {
              enrollmentId: enrollment.id,
              monthNumber: unlockedMonth,
            },
          });
        } catch {
          // Unique constraint — already notified for this month
          continue;
        }

        await this.notificationsService.notifyUser({
          userId: enrollment.student.userId,
          title: `Month ${unlockedMonth} unlocked`,
          body: `Your Month ${unlockedMonth} courses are now available.`,
          eventType: 'MONTH_UNLOCKED',
          payload: {
            monthNumber: unlockedMonth,
            enrollmentId: enrollment.id,
          },
        });
        processed += 1;
      }

      cursor = enrollments[enrollments.length - 1]?.id;
      if (enrollments.length < ENROLLMENT_BATCH_SIZE) {
        break;
      }
    }

    this.logger.log(`Drip unlock scan complete; notified=${processed}`);
  }

  private async processAssignmentReminders() {
    const now = new Date();
    const windows = [24, 48] as const;

    for (const windowHours of windows) {
      const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
      const assignments = await this.prisma.assignment.findMany({
        where: {
          deletedAt: null,
          dueAt: { gt: now, lte: windowEnd },
          course: { status: 'PUBLISHED', deletedAt: null },
        },
        include: { course: true },
      });

      for (const assignment of assignments) {
        const unlockCutoffMs =
          (assignment.course.monthNumber - 1) *
          getDripDaysPerMonth() *
          24 *
          60 *
          60 *
          1000;
        const unlockCutoff = new Date(now.getTime() - unlockCutoffMs);

        const enrollments = await this.prisma.enrollment.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            cohortStartedAt: { lte: unlockCutoff },
            student: {
              deletedAt: null,
              submissions: {
                none: {
                  assignmentId: assignment.id,
                  deletedAt: null,
                },
              },
            },
          },
          include: { student: true },
        });

        for (const enrollment of enrollments) {
          try {
            await this.prisma.reminderCursor.create({
              data: {
                assignmentId: assignment.id,
                userId: enrollment.student.userId,
                windowHours,
              },
            });
          } catch {
            continue;
          }

          await this.notificationsService.notifyUser({
            userId: enrollment.student.userId,
            title: 'Assignment due soon',
            body: `"${assignment.title}" is due within ${windowHours} hours.`,
            eventType: 'ASSIGNMENT_REMINDER',
            payload: {
              assignmentId: assignment.id,
              windowHours,
            },
          });
        }
      }
    }

    this.logger.log('Assignment reminder scan complete');
  }
}
