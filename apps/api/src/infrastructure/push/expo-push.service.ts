import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly pushUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(private readonly configService: ConfigService) {}

  isExpoPushToken(token: string): boolean {
    return (
      token.startsWith('ExponentPushToken[') ||
      token.startsWith('ExpoPushToken[')
    );
  }

  async send(
    tokens: string[],
    payload: { title: string; body: string; url?: string },
  ): Promise<{ invalidTokens: string[] }> {
    const validTokens = tokens.filter((token) => this.isExpoPushToken(token));
    if (validTokens.length === 0) {
      return { invalidTokens: [] };
    }

    const webUrl =
      this.configService.get<string>('web.publicUrl') ??
      'http://localhost:3000';

    const messages: ExpoPushMessage[] = validTokens.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      sound: 'default',
      data: { url: payload.url ?? webUrl },
    }));

    const invalidTokens: string[] = [];

    try {
      const response = await fetch(this.pushUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        this.logger.warn(
          `Expo push HTTP ${response.status}: ${await response.text()}`,
        );
        return { invalidTokens };
      }

      const result = (await response.json()) as {
        data?: ExpoPushTicket[];
      };

      for (const [index, ticket] of (result.data ?? []).entries()) {
        if (ticket.status === 'error') {
          const errorCode = ticket.details?.error;
          this.logger.warn(
            `Expo push failed for ${validTokens[index]}: ${ticket.message ?? errorCode}`,
          );
          if (
            errorCode === 'DeviceNotRegistered' ||
            errorCode === 'InvalidCredentials'
          ) {
            invalidTokens.push(validTokens[index]!);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Expo push request failed: ${String(error)}`);
    }

    return { invalidTokens };
  }
}
