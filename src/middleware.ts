/**
 * Next.js Middleware - Centralized route protection.
 *
 * Uses a separate edge-safe Auth.js instance that does NOT import Prisma/pg.
 * The full auth with Prisma adapter is only used in server components/actions.
 */

import NextAuth from 'next-auth';
import { authConfigEdge } from '@/lib/auth/config.edge';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfigEdge);

type AuthRequest = Parameters<Parameters<typeof auth>[0]>[0];

function unauthorizedResponse(req: AuthRequest, isApi: boolean) {
  return isApi
    ? NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    : NextResponse.redirect(new URL('/login', req.url));
}

function forbiddenResponse(req: AuthRequest, isApi: boolean, message: string) {
  return isApi
    ? NextResponse.json({ error: message }, { status: 403 })
    : NextResponse.redirect(new URL('/', req.url));
}

function checkRouteAccess(
  req: AuthRequest,
  isApi: boolean,
  allowedRoles: string[],
  errorMessage: string
) {
  if (!req.auth?.user) {
    return unauthorizedResponse(req, isApi);
  }
  if (!allowedRoles.includes(req.auth.user.role)) {
    return forbiddenResponse(req, isApi, errorMessage);
  }
  return null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return checkRouteAccess(req, isApi, ['ADMIN'], 'Acces reserve aux administrateurs') ?? NextResponse.next();
  }

  if (pathname.startsWith('/creator') || pathname.startsWith('/api/creator')) {
    return checkRouteAccess(req, isApi, ['CREATOR', 'ADMIN'], 'Acces reserve aux createurs') ?? NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/creator/:path*',
    '/api/creator/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/login',
    '/signup',
  ],
};
