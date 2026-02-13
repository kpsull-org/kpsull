import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma/client';
import { registerSchema } from '@/lib/schemas/auth.schema';
import { SendVerificationCodeUseCase } from '@/modules/auth/application/use-cases/send-verification-code.use-case';
import { PrismaVerificationTokenRepository } from '@/modules/auth/infrastructure/repositories/prisma-verification-token.repository';
import { configureContainer, getContainer } from '@/shared/infrastructure/di/registry';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import type { IEmailService } from '@/modules/notifications/application/ports/email.service.interface';

/**
 * POST /api/auth/register
 *
 * Register a new user with email/password.
 * If a user with the same email exists (from Google OAuth),
 * adds the password to enable both login methods.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: 'Validation failed', fieldErrors: errors },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (existingUser) {
      // If user exists with a password, reject registration
      if (existingUser.hashedPassword) {
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cette adresse email' },
          { status: 409 }
        );
      }

      // User exists from OAuth (Google) but has no password
      // Link the password to the existing account
      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          hashedPassword,
          name: existingUser.name || name, // Keep existing name if set
        },
      });

      // Create a "credentials" account entry for tracking
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: existingUser.id,
        },
      });

      return NextResponse.json(
        {
          message: 'Mot de passe ajouté à votre compte existant',
          linked: true,
        },
        { status: 200 }
      );
    }

    // Create new user with password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        emailVerified: null, // Not verified yet
      },
    });

    // Create a "credentials" account entry
    await prisma.account.create({
      data: {
        userId: newUser.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: newUser.id,
      },
    });

    // Send verification code
    try {
      configureContainer();
      const container = getContainer();
      const emailService = container.get<IEmailService>(TOKENS.EmailService);
      const verificationTokenRepo = new PrismaVerificationTokenRepository(prisma);
      const sendCode = new SendVerificationCodeUseCase(verificationTokenRepo, emailService);
      await sendCode.execute({ email, type: 'email-verification' });
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }

    return NextResponse.json(
      {
        message: 'Compte créé avec succès',
        userId: newUser.id,
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}
