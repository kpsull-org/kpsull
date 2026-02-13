import type { Result } from '@/shared/domain';

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  id: string;
}

export interface IEmailService {
  send(input: SendEmailInput): Promise<Result<SendEmailResult>>;
  sendBatch(inputs: SendEmailInput[]): Promise<Result<SendEmailResult[]>>;
}
