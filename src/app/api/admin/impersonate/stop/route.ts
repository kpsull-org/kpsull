import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
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

export async function POST() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (!adminId) {
    return NextResponse.json(
      { error: 'Pas en mode impersonification' },
      { status: 400 }
    );
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accountTypeChosen: true,
      wantsToBeCreator: true,
    },
  });

  if (!adminUser || adminUser.role !== 'ADMIN') {
    cookieStore.delete(IMPERSONATION_COOKIE);
    return NextResponse.json({ error: 'Admin non trouve' }, { status: 404 });
  }

  const sessionCookieName =
    process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';

  const token = await encode({
    token: {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      accountTypeChosen: adminUser.accountTypeChosen,
      wantsToBeCreator: adminUser.wantsToBeCreator,
      refreshedAt: Date.now(),
    },
    secret: getAuthSecret(),
    salt: sessionCookieName,
    maxAge: SESSION_MAX_AGE,
  });

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  cookieStore.delete(IMPERSONATION_COOKIE);

  return NextResponse.json({ success: true, redirectUrl: '/admin' });
}
