import { ContentReleaseProcessor } from '../../modules/content-release/content-release.processor';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ContentReleaseProcessor drip idempotency', () => {
  const prisma = {
    enrollment: { findMany: jest.fn() },
    contentReleaseCursor: { create: jest.fn() },
    assignment: { findMany: jest.fn() },
    reminderCursor: { create: jest.fn() },
  };
  const notifications = {
    notifyUser: jest.fn(),
  };

  const processor = new ContentReleaseProcessor(
    prisma as unknown as PrismaService,
    notifications as unknown as NotificationsService,
  );

  beforeEach(() => {
    prisma.enrollment.findMany.mockReset();
    prisma.contentReleaseCursor.create.mockReset();
    notifications.notifyUser.mockReset();
  });

  it('skips notify when contentReleaseCursor unique constraint hits', async () => {
    prisma.enrollment.findMany.mockResolvedValue([
      {
        id: 'enr-1',
        cohortStartedAt: new Date('2020-01-01T00:00:00.000Z'),
        student: { userId: 'user-1' },
      },
    ]);
    prisma.contentReleaseCursor.create.mockRejectedValue(
      new Error('Unique constraint failed'),
    );

    await processor.process({ name: 'scan-drip-unlocks' } as never);

    expect(notifications.notifyUser).not.toHaveBeenCalled();
  });

  it('notifies once when cursor create succeeds', async () => {
    prisma.enrollment.findMany
      .mockResolvedValueOnce([
        {
          id: 'enr-1',
          cohortStartedAt: new Date('2020-01-01T00:00:00.000Z'),
          student: { userId: 'user-1' },
        },
      ])
      .mockResolvedValueOnce([]);
    prisma.contentReleaseCursor.create.mockResolvedValue({ id: 'cursor-1' });
    notifications.notifyUser.mockResolvedValue(undefined);

    await processor.process({ name: 'scan-drip-unlocks' } as never);

    expect(prisma.contentReleaseCursor.create).toHaveBeenCalled();
    expect(notifications.notifyUser).toHaveBeenCalledTimes(1);
  });
});
