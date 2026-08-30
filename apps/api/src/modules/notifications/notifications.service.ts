import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { DevicePlatform } from '@prisma/client';
import { Queue } from 'bullmq';
import {
  DeliverNotificationJob,
  QUEUE_NAMES,
} from '../../infrastructure/queues/queue.constants';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private readonly notificationsQueue: Queue<DeliverNotificationJob>,
  ) {}

  listForUser(userId: string) {
    return this.notificationsRepository.listForUser(userId);
  }

  async markRead(userId: string, notificationId: string) {
    const result = await this.notificationsRepository.markRead(
      notificationId,
      userId,
    );
    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }
    return { ok: true };
  }

  async notifyUser(input: {
    userId: string;
    title: string;
    body: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }) {
    const notification =
      await this.notificationsRepository.createWithDeliveries(input);

    await this.notificationsQueue.add(
      'deliver-notification',
      { notificationId: notification.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );

    return notification;
  }

  savePushSubscription(
    userId: string,
    body: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    },
  ) {
    return this.notificationsRepository.upsertPushSubscription({
      userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent,
    });
  }

  async removePushSubscription(userId: string, endpoint: string) {
    await this.notificationsRepository.deletePushSubscription(userId, endpoint);
    return { ok: true };
  }

  saveDevicePushToken(
    userId: string,
    body: {
      token: string;
      platform: DevicePlatform;
      deviceName?: string;
    },
  ) {
    return this.notificationsRepository.upsertDevicePushToken({
      userId,
      token: body.token,
      platform: body.platform,
      deviceName: body.deviceName,
    });
  }

  async removeDevicePushToken(userId: string, token: string) {
    await this.notificationsRepository.deleteDevicePushToken(userId, token);
    return { ok: true };
  }
}
