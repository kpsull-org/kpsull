import { NextResponse } from 'next/server';
import { verifyEmailSchema } from '@/lib/schemas/verification.schema';
import { VerifyEmailUseCase } from '@/modules/auth/application/use-cases/verify-email.use-case';
import { PrismaVerificationTokenRepository } from '@/modules/auth/infrastructure/repositories/prisma-verification-token.repository';
import { prisma } from '@/lib/prisma/client';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 });
    }

    const { email, code } = parsed.data;

    const { allowed } = checkRateLimit(`verify-confirm:${email}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      );
    }

    const verificationTokenRepo = new PrismaVerificationTokenRepository(prisma);
    const useCase = new VerifyEmailUseCase(verificationTokenRepo, prisma);
    const result = await useCase.execute({ email, code });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Email vérifié avec succès.' });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
