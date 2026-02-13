import { Resend } from 'resend';
import { Result } from '@/shared/domain';
import type {
  IEmailService,
  SendEmailInput,
  SendEmailResult,
} from '../../application/ports/email.service.interface';

export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;
  private readonly fromAddress: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    this.resend = new Resend(apiKey);
    this.fromAddress =
      process.env.RESEND_FROM_ADDRESS || 'Kpsull <kpsul.tech@gmail.com>';
  }

  async send(input: SendEmailInput): Promise<Result<SendEmailResult>> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
        tags: input.tags,
      });

      if (error) {
        return Result.fail<SendEmailResult>(`Erreur envoi email: ${error.message}`);
      }

      return Result.ok<SendEmailResult>({ id: data!.id });
    } catch (err) {
      return Result.fail<SendEmailResult>(
        `Erreur Resend: ${(err as Error).message}`
      );
    }
  }

  async sendBatch(inputs: SendEmailInput[]): Promise<Result<SendEmailResult[]>> {
    try {
      const { data, error } = await this.resend.batch.send(
        inputs.map((input) => ({
          from: this.fromAddress,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          replyTo: input.replyTo,
          tags: input.tags,
        }))
      );

      if (error) {
        return Result.fail<SendEmailResult[]>(`Erreur batch email: ${error.message}`);
      }

      return Result.ok<SendEmailResult[]>(
        data!.data.map((d) => ({ id: d.id }))
      );
    } catch (err) {
      return Result.fail<SendEmailResult[]>(
        `Erreur Resend batch: ${(err as Error).message}`
      );
    }
  }
}
