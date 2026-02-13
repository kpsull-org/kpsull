import { Result } from '@/shared/domain';
import { OTP } from '../../domain/value-objects/otp.vo';
import type { IVerificationTokenRepository } from '../ports/verification-token.repository.interface';
import type { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly prisma: PrismaClient
  ) {}

  async execute(input: ResetPasswordInput): Promise<Result<void>> {
    const identifier = `password-reset:${input.email.toLowerCase().trim()}`;

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

    const hashedPassword = await hash(input.newPassword, 12);
    await this.prisma.user.update({
      where: { email: input.email.toLowerCase().trim() },
      data: { hashedPassword },
    });

    await this.verificationTokenRepository.deleteByIdentifier(identifier);

    return Result.ok<void>();
  }
}
