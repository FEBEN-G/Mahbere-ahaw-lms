import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { MailService } from '../../infrastructure/mail/mail.service';
import { ExpoPushService } from '../../infrastructure/push/expo-push.service';
import { PushService } from '../../infrastructure/push/push.service';
import {
  DeliverNotificationJob,
  QUEUE_NAMES,
} from '../../infrastructure/queues/queue.constants';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsRepository } from './notifications.repository';

@Processor(QUEUE_NAMES.NOTIFICATIONS)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly mailService: MailService,
    private readonly pushService: PushService,
    private readonly expoPushService: ExpoPushService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error({
      msg: 'job_failed',
      queue: QUEUE_NAMES.NOTIFICATIONS,
      jobId: job?.id,
      jobName: job?.name,
      attemptsMade: job?.attemptsMade,
      error: error.message,
    });
  }

  async process(job: Job<DeliverNotificationJob>) {
    const notification =
      await this.notificationsRepository.findByIdWithUser(
        job.data.notificationId,
      );
    if (!notification) {
      this.logger.warn(`Notification ${job.data.notificationId} not found`);
      return;
    }

    for (const delivery of notification.deliveries) {
      try {
        await this.deliverChannel(notification, delivery.channel);
        await this.notificationsRepository.updateDelivery(
          notification.id,
          delivery.channel,
          {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
            error: null,
          },
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Delivery failed';
        await this.notificationsRepository.updateDelivery(
          notification.id,
          delivery.channel,
          {
            status: NotificationStatus.FAILED,
            error: message,
          },
        );
      }
    }

    await this.notificationsRepository.markNotificationSent(notification.id);
  }

  private async deliverChannel(
    notification: NonNullable<
      Awaited<ReturnType<NotificationsRepository['findByIdWithUser']>>
    >,
    channel: NotificationChannel,
  ) {
    switch (channel) {
      case NotificationChannel.IN_APP:
        return;
      case NotificationChannel.WEBSOCKET:
        this.notificationsGateway.emitToUser(
          notification.userId,
          'notification.created',
          {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            eventType: notification.eventType,
            createdAt: notification.createdAt,
          },
        );
        return;
      case NotificationChannel.EMAIL:
        await this.mailService.sendMail({
          to: notification.user.email,
          subject: notification.title,
          text: notification.body,
          html: `<h2>${notification.title}</h2><p>${notification.body}</p>`,
        });
        return;
      case NotificationChannel.PUSH: {
        const webUrl =
          this.configService.get<string>('web.publicUrl') ??
          'http://localhost:3000';
        const payload = {
          title: notification.title,
          body: notification.body,
          url: webUrl,
        };

        const subscriptions =
          await this.notificationsRepository.listPushSubscriptions(
            notification.userId,
          );
        for (const subscription of subscriptions) {
          const result = await this.pushService.send(
            {
              endpoint: subscription.endpoint,
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
            payload,
          );
          if (result.statusCode === 404 || result.statusCode === 410) {
            await this.notificationsRepository.deletePushByEndpoint(
              subscription.endpoint,
            );
          }
        }

        const deviceTokens =
          await this.notificationsRepository.listDevicePushTokens(
            notification.userId,
          );
        if (deviceTokens.length > 0) {
          const { invalidTokens } = await this.expoPushService.send(
            deviceTokens.map((entry) => entry.token),
            payload,
          );
          await this.notificationsRepository.deleteDevicePushTokens(
            invalidTokens,
          );
        }
        return;
      }
      default:
        return;
    }
  }
}
