import { NextResponse } from 'next/server';
import { requestPasswordResetSchema } from '@/lib/schemas/verification.schema';
import { SendVerificationCodeUseCase } from '@/modules/auth/application/use-cases/send-verification-code.use-case';
import { RequestPasswordResetUseCase } from '@/modules/auth/application/use-cases/request-password-reset.use-case';
import { PrismaVerificationTokenRepository } from '@/modules/auth/infrastructure/repositories/prisma-verification-token.repository';
import { prisma } from '@/lib/prisma/client';
import { configureContainer, getContainer } from '@/shared/infrastructure/di/registry';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import type { IEmailService } from '@/modules/notifications/application/ports/email.service.interface';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestPasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 });
    }

    const { email } = parsed.data;

    const { allowed } = checkRateLimit(`forgot-password:${email}`, 3, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes. Réessayez plus tard.' },
        { status: 429 }
      );
    }

    configureContainer();
    const container = getContainer();
    const emailService = container.get<IEmailService>(TOKENS.EmailService);
    const verificationTokenRepo = new PrismaVerificationTokenRepository(prisma);

    const sendCode = new SendVerificationCodeUseCase(verificationTokenRepo, emailService);
    const useCase = new RequestPasswordResetUseCase(sendCode);
    const result = await useCase.execute({ email });

    return NextResponse.json({
      message: 'Si un compte existe avec cette adresse, un code a été envoyé.',
      expiresAt: result.value.expiresAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
