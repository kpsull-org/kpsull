import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

const IMPERSONATION_MAX_AGE = 60 * 60; // 1 hour in seconds
const IMPERSONATION_COOKIE = 'kpsull-admin-impersonating';

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'Missing AUTH_SECRET or NEXTAUTH_SECRET environment variable'
    );
  }
  return secret;
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accountTypeChosen: true,
      wantsToBeCreator: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: 'Utilisateur non trouve' },
      { status: 404 }
    );
  }

  const cookieStore = await cookies();

  // Store the original admin's user ID so we can restore the session later
  cookieStore.set(IMPERSONATION_COOKIE, session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: IMPERSONATION_MAX_AGE,
  });

  const sessionCookieName =
    process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';

  // Create a new JWT for the target user
  const token = await encode({
    token: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      accountTypeChosen: targetUser.accountTypeChosen,
      wantsToBeCreator: targetUser.wantsToBeCreator,
      refreshedAt: Date.now(),
    },
    secret: getAuthSecret(),
    salt: sessionCookieName,
    maxAge: IMPERSONATION_MAX_AGE,
  });

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: IMPERSONATION_MAX_AGE,
  });

  const redirectUrl = targetUser.role === 'CREATOR' ? '/dashboard' : '/';
  return NextResponse.json({ success: true, redirectUrl });
}
