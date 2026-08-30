import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.from =
      this.configService.get<string>('smtp.from') ??
      'Mahbere Ahaw LMS <noreply@mahbereahaw.org>';
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('smtp.host') ?? 'localhost',
      port: this.configService.get<number>('smtp.port') ?? 1025,
      secure: this.configService.get<boolean>('smtp.secure') ?? false,
      auth: this.buildAuth(),
    });
  }

  private buildAuth():
    | { user: string; pass: string }
    | undefined {
    const user = this.configService.get<string>('smtp.user') ?? '';
    const pass = this.configService.get<string>('smtp.pass') ?? '';
    if (!user && !pass) {
      return undefined;
    }
    return { user, pass };
  }

  async sendMail(input: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<p>${input.text}</p>`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${input.to}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
