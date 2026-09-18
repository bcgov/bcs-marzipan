import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

interface NotificationEmailRecipient {
  userId: number;
  email: string;
  displayName: string | null;
}

interface SendNotificationEmailInput {
  eventType: string;
  entityType: string;
  entityId: number;
  summary: string;
  details: Record<string, unknown> | null;
  actorUsername: string;
  recipients: NotificationEmailRecipient[];
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return defaultValue;
}

@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);
  private transporter: Transporter | null | undefined;

  constructor(private readonly configService: ConfigService) {}

  private isEnabled(): boolean {
    return parseBoolean(
      this.configService.get<string>('NOTIFICATIONS_EMAIL_ENABLED'),
      false
    );
  }

  private getFromAddress(): string | null {
    const fromAddress = this.configService
      .get<string>('NOTIFICATIONS_EMAIL_FROM')
      ?.trim();
    return fromAddress && fromAddress.length > 0 ? fromAddress : null;
  }

  private getPublicAppBaseUrl(): string {
    const configured = this.configService
      .get<string>('PUBLIC_APP_BASE_URL')
      ?.trim();
    if (!configured) return 'http://localhost:3000';
    return configured.replace(/\/+$/, '');
  }

  private resolveLinkPath(input: SendNotificationEmailInput): string {
    if (input.entityType === 'activity') {
      return `/activity/${input.entityId}`;
    }

    const details = input.details ?? {};
    const detailsUserId =
      typeof details.userId === 'number' ? details.userId : undefined;
    const detailsTeamId =
      typeof details.teamId === 'number' ? details.teamId : undefined;

    if (detailsUserId != null) {
      return `/users/${detailsUserId}`;
    }

    if (detailsTeamId != null) {
      return `/teams/${detailsTeamId}`;
    }

    if (input.entityType === 'team') {
      return `/teams/${input.entityId}`;
    }

    return '/notifications';
  }

  private getTransporter(): Transporter | null {
    if (this.transporter !== undefined) {
      return this.transporter;
    }

    if (!this.isEnabled()) {
      this.transporter = null;
      return this.transporter;
    }

    const fromAddress = this.getFromAddress();
    const host = this.configService
      .get<string>('NOTIFICATIONS_SMTP_HOST')
      ?.trim();

    if (!fromAddress || !host) {
      this.logger.warn(
        'Notification email is enabled but NOTIFICATIONS_EMAIL_FROM or NOTIFICATIONS_SMTP_HOST is missing. Email delivery disabled.'
      );
      this.transporter = null;
      return this.transporter;
    }

    const secure = parseBoolean(
      this.configService.get<string>('NOTIFICATIONS_SMTP_SECURE'),
      false
    );
    const defaultPort = secure ? 465 : 587;
    const parsedPort = Number.parseInt(
      this.configService.get<string>('NOTIFICATIONS_SMTP_PORT') ??
        String(defaultPort),
      10
    );
    const port = Number.isFinite(parsedPort) ? parsedPort : defaultPort;

    const user = this.configService
      .get<string>('NOTIFICATIONS_SMTP_USER')
      ?.trim();
    const pass = this.configService
      .get<string>('NOTIFICATIONS_SMTP_PASS')
      ?.trim();

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass ?? '' } : undefined,
    });

    return this.transporter;
  }

  async sendNotificationEventEmail(
    input: SendNotificationEmailInput
  ): Promise<void> {
    if (!this.isEnabled() || input.recipients.length === 0) {
      return;
    }

    const transporter = this.getTransporter();
    const fromAddress = this.getFromAddress();
    if (!transporter || !fromAddress) {
      return;
    }

    const subjectPrefix =
      this.configService.get<string>('NOTIFICATIONS_EMAIL_SUBJECT_PREFIX') ??
      '[Corporate Calendar]';
    const subject = `${subjectPrefix} ${input.summary}`.trim();

    const notificationPath = this.resolveLinkPath(input);
    const notificationUrl = `${this.getPublicAppBaseUrl()}${notificationPath}`;

    const sendResults = await Promise.allSettled(
      input.recipients.map((recipient) => {
        const greeting = recipient.displayName
          ? `Hi ${recipient.displayName},`
          : 'Hello,';

        return transporter.sendMail({
          from: fromAddress,
          to: recipient.email,
          subject,
          text: [
            greeting,
            '',
            `You have a new Corporate Calendar notification from ${input.actorUsername}.`,
            input.summary,
            '',
            `Open: ${notificationUrl}`,
          ].join('\n'),
        });
      })
    );

    sendResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.warn(
          `Failed to send notification email to user ${input.recipients[index]?.userId}: ${String(result.reason)}`
        );
      }
    });

    this.logger.debug(
      `Notification email dispatch attempted for ${input.recipients.length} recipient(s).`
    );
  }
}
