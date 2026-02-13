import { Result } from '@/shared/domain';
import { OTP } from '../../domain/value-objects/otp.vo';
import type { IVerificationTokenRepository } from '../ports/verification-token.repository.interface';
import type { PrismaClient } from '@prisma/client';

interface VerifyEmailInput {
  email: string;
  code: string;
}

export class VerifyEmailUseCase {
  constructor(
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly prisma: PrismaClient
  ) {}

  async execute(input: VerifyEmailInput): Promise<Result<void>> {
    const identifier = `email-verification:${input.email.toLowerCase().trim()}`;

    const tokenData = await this.verificationTokenRepository.findByIdentifier(identifier);
    if (!tokenData) {
      return Result.fail<void>('Code invalide ou expiré.');
    }

    const otp = OTP.fromExisting(tokenData.token, tokenData.expires);

    if (otp.isExpired()) {
      await this.verificationTokenRepository.deleteByIdentifier(identifier);
      return Result.fail<void>('Le code a expiré. Veuillez en demander un nouveau.');
    }

    if (!otp.matches(input.code)) {
      return Result.fail<void>('Code incorrect.');
    }

    await this.prisma.user.update({
      where: { email: input.email.toLowerCase().trim() },
      data: { emailVerified: new Date() },
    });

    await this.verificationTokenRepository.deleteByIdentifier(identifier);

    return Result.ok<void>();
  }
}
