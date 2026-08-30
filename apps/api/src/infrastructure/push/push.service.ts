import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('vapid.publicKey') ?? '';
    const privateKey = this.configService.get<string>('vapid.privateKey') ?? '';
    const subject =
      this.configService.get<string>('vapid.subject') ??
      'mailto:admin@mahbereahaw.org';

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID keys missing — browser push delivery is disabled',
      );
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.enabled = true;
  }

  isEnabled() {
    return this.enabled;
  }

  async send(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: { title: string; body: string; url?: string },
  ) {
    if (!this.enabled) {
      return { sent: false as const, reason: 'disabled' as const };
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload),
      );
      return { sent: true as const, statusCode: undefined };
    } catch (error) {
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode: number }).statusCode)
          : undefined;
      this.logger.warn(
        `Push failed for ${subscription.endpoint}: ${String(error)}`,
      );
      return {
        sent: false as const,
        reason: 'error' as const,
        statusCode,
      };
    }
  }
}
