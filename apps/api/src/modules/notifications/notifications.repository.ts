import { Injectable } from '@nestjs/common';
import {
  DevicePlatform,
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithDeliveries(input: {
    userId: string;
    title: string;
    body: string;
    eventType: string;
    payload?: Record<string, unknown>;
    channels?: NotificationChannel[];
  }) {
    const channels = input.channels ?? [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
      NotificationChannel.PUSH,
      NotificationChannel.WEBSOCKET,
    ];

    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        eventType: input.eventType,
        payload: input.payload as Prisma.InputJsonValue | undefined,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.QUEUED,
        deliveries: {
          create: channels.map((channel) => ({
            channel,
            status: NotificationStatus.PENDING,
          })),
        },
      },
      include: { deliveries: true, user: true },
    });
  }

  findByIdWithUser(id: string) {
    return this.prisma.notification.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: true,
        deliveries: true,
      },
    });
  }

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        deletedAt: null,
        channel: NotificationChannel.IN_APP,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  updateDelivery(
    notificationId: string,
    channel: NotificationChannel,
    data: {
      status: NotificationStatus;
      error?: string | null;
      sentAt?: Date | null;
    },
  ) {
    return this.prisma.notificationDelivery.update({
      where: {
        notificationId_channel: { notificationId, channel },
      },
      data,
    });
  }

  markNotificationSent(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  upsertPushSubscription(input: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      update: {
        userId: input.userId,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent,
      },
      create: input,
    });
  }

  deletePushSubscription(userId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  listPushSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({ where: { userId } });
  }

  deletePushByEndpoint(endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  upsertDevicePushToken(input: {
    userId: string;
    token: string;
    platform: DevicePlatform;
    deviceName?: string;
  }) {
    return this.prisma.devicePushToken.upsert({
      where: { token: input.token },
      update: {
        userId: input.userId,
        platform: input.platform,
        deviceName: input.deviceName,
      },
      create: input,
    });
  }

  deleteDevicePushToken(userId: string, token: string) {
    return this.prisma.devicePushToken.deleteMany({
      where: { userId, token },
    });
  }

  listDevicePushTokens(userId: string) {
    return this.prisma.devicePushToken.findMany({ where: { userId } });
  }

  deleteDevicePushTokens(tokens: string[]) {
    if (tokens.length === 0) {
      return Promise.resolve({ count: 0 });
    }
    return this.prisma.devicePushToken.deleteMany({
      where: { token: { in: tokens } },
    });
  }
}
