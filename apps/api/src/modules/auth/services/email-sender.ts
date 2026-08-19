import { Injectable, Logger } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

// Puerto de envío de emails transaccionales. En este paso solo existe la
// implementación de consola (dev) — swap a un proveedor real (Resend/SES)
// es un cambio de una sola clase, sin tocar AuthService. Mismo patrón que
// PaymentGatewayPort descrito en .claude/steering/subscriptions.md.
export abstract class EmailSender {
  abstract send(message: EmailMessage): Promise<void>;
}

@Injectable()
export class ConsoleEmailSender extends EmailSender {
  private readonly logger = new Logger(ConsoleEmailSender.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(`[email] to=${message.to} subject="${message.subject}"\n${message.body}`);
  }
}
