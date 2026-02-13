import type { PrismaClient } from '@prisma/client';
import type {
  IVerificationTokenRepository,
  VerificationTokenData,
} from '../../application/ports/verification-token.repository.interface';

export class PrismaVerificationTokenRepository implements IVerificationTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(identifier: string, token: string, expires: Date): Promise<void> {
    await this.prisma.verificationToken.deleteMany({
      where: { identifier },
    });
    await this.prisma.verificationToken.create({
      data: { identifier, token, expires },
    });
  }

  async findByIdentifier(identifier: string): Promise<VerificationTokenData | null> {
    return this.prisma.verificationToken.findFirst({
      where: { identifier },
    });
  }

  async delete(identifier: string, token: string): Promise<void> {
    await this.prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token } },
    });
  }

  async deleteByIdentifier(identifier: string): Promise<void> {
    await this.prisma.verificationToken.deleteMany({
      where: { identifier },
    });
  }
}
