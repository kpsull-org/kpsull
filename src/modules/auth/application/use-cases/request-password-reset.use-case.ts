import { Result } from '@/shared/domain';
import type { SendVerificationCodeUseCase } from './send-verification-code.use-case';

interface RequestPasswordResetInput {
  email: string;
}

export class RequestPasswordResetUseCase {
  constructor(private readonly sendVerificationCode: SendVerificationCodeUseCase) {}

  async execute(input: RequestPasswordResetInput): Promise<Result<{ expiresAt: Date }>> {
    const result = await this.sendVerificationCode.execute({
      email: input.email,
      type: 'password-reset',
    });

    // Always return success to prevent email enumeration
    if (result.isFailure) {
      console.error(`Failed to send password reset email: ${result.error}`);
    }

    return Result.ok({
      expiresAt: result.isSuccess
        ? result.value.expiresAt
        : new Date(Date.now() + 10 * 60 * 1000),
    });
  }
}
