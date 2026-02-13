import { Result } from '@/shared/domain';
import type {
  IEmailService,
  SendEmailInput,
  SendEmailResult,
} from '../../application/ports/email.service.interface';

export class ConsoleEmailService implements IEmailService {
  async send(input: SendEmailInput): Promise<Result<SendEmailResult>> {
    const id = `console-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    console.log(`[Email] To: ${Array.isArray(input.to) ? input.to.join(', ') : input.to}`);
    console.log(`[Email] Subject: ${input.subject}`);
    console.log(`[Email] HTML length: ${input.html.length} chars`);
    if (input.text) {
      console.log(`[Email] Text: ${input.text.slice(0, 200)}...`);
    }

    return Result.ok<SendEmailResult>({ id });
  }

  async sendBatch(inputs: SendEmailInput[]): Promise<Result<SendEmailResult[]>> {
    const results: SendEmailResult[] = [];

    for (const input of inputs) {
      const result = await this.send(input);
      if (result.isFailure) {
        return Result.fail<SendEmailResult[]>(result.error!);
      }
      results.push(result.value);
    }

    return Result.ok<SendEmailResult[]>(results);
  }
}
