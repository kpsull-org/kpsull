/**
 * Next.js Middleware - Centralized route protection.
 * Uses Auth.js auth() wrapper for session access.
 *
 * Replaces per-page auth checks for admin and creator routes.
 */

import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');

  // Admin routes protection: /admin/* and /api/admin/*
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!req.auth?.user) {
      return isApiRoute
        ? NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', req.url));
    }
    if (req.auth.user.role !== 'ADMIN') {
      return isApiRoute
        ? NextResponse.json(
            { error: 'Acces reserve aux administrateurs' },
            { status: 403 }
          )
        : NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Creator routes protection: /creator/* and /api/creator/*
  if (pathname.startsWith('/creator') || pathname.startsWith('/api/creator')) {
    if (!req.auth?.user) {
      return isApiRoute
        ? NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', req.url));
    }
    const allowedRoles = ['CREATOR', 'ADMIN'];
    if (!allowedRoles.includes(req.auth.user.role)) {
      return isApiRoute
        ? NextResponse.json(
            { error: 'Acces reserve aux createurs' },
            { status: 403 }
          )
        : NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/creator/:path*',
    '/api/creator/:path*',
  ],
};
