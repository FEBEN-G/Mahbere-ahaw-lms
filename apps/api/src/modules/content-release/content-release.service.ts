import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { acquireRedisLock } from '../../common/utils/redis-lock.util';
import {
  ContentReleaseScanJob,
  QUEUE_NAMES,
} from '../../infrastructure/queues/queue.constants';

@Injectable()
export class ContentReleaseService {
  private readonly logger = new Logger(ContentReleaseService.name);
  private readonly redis: Redis;
  private readonly instanceToken = randomUUID();

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(QUEUE_NAMES.CONTENT_RELEASE)
    private readonly contentReleaseQueue: Queue<
      ContentReleaseScanJob | Record<string, never>
    >,
  ) {
    this.redis = new Redis(
      this.configService.get<string>('redis.url') ?? 'redis://localhost:6379',
      { maxRetriesPerRequest: null, lazyConnect: true },
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleDripUnlocks() {
    await this.enqueueIfLeader(
      'cron:content-release:drip',
      'scan-drip-unlocks',
      {},
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleAssignmentReminders() {
    await this.enqueueIfLeader(
      'cron:content-release:reminders',
      'scan-assignment-reminders',
      {},
    );
  }

  private async enqueueIfLeader(
    lockKey: string,
    jobName: string,
    data: ContentReleaseScanJob | Record<string, never>,
  ) {
    try {
      if (this.redis.status !== 'ready') {
        await this.redis.connect();
      }
      const acquired = await acquireRedisLock(
        this.redis,
        lockKey,
        55,
        this.instanceToken,
      );
      if (!acquired) {
        this.logger.debug(`Skipped ${jobName}; another instance holds lock`);
        return;
      }

      await this.contentReleaseQueue.add(jobName, data, {
        attempts: 2,
        removeOnComplete: 100,
        removeOnFail: 50,
      });
      this.logger.log(`Enqueued ${jobName}`);
    } catch (error) {
      this.logger.error({
        msg: 'content_release_enqueue_failed',
        jobName,
        error: String(error),
      });
    }
  }
}
