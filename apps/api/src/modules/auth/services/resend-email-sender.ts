import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfigService } from '../../../config/app-config.service';
import { EmailMessage, EmailSender } from './email-sender';

@Injectable()
export class ResendEmailSender extends EmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);
  private readonly client: Resend;
  private readonly from: string;

  constructor(config: AppConfigService) {
    super();
    const apiKey = config.resendApiKey;
    const from = config.emailFrom;
    if (!apiKey || !from) {
      throw new InternalServerErrorException(
        'ResendEmailSender requiere RESEND_API_KEY y EMAIL_FROM configurados.',
      );
    }
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      // El body de AuthService ya viene como texto plano con un link — los
      // saltos de línea se preservan en HTML para que el link quede legible.
      html: message.body.replace(/\n/g, '<br/>'),
    });
    if (error) {
      this.logger.error(`No se pudo enviar email a ${message.to}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo enviar el email.');
    }
  }
}
