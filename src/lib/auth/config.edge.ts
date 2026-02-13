import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe Auth.js configuration.
 *
 * This config contains ONLY settings that are safe to run in the edge runtime
 * (no Prisma, no pg, no Node.js crypto). It is used by the middleware.
 *
 * The full config in config.ts extends this with Prisma-dependent providers
 * and callbacks.
 */
export const authConfigEdge = {
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
  },
  providers: [], // Providers are added in the full config (config.ts)
  callbacks: {
    // Map custom JWT fields to the session so middleware can access them
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'CLIENT' | 'CREATOR' | 'ADMIN';
        session.user.accountTypeChosen = token.accountTypeChosen as boolean;
        session.user.wantsToBeCreator = token.wantsToBeCreator as boolean;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/profile') ||
        nextUrl.pathname.startsWith('/admin');
      const isAuthPage =
        nextUrl.pathname === '/login' || nextUrl.pathname === '/signup';

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && isAuthPage) {
        const role = auth.user.role;
        if (role === 'ADMIN') {
          return Response.redirect(new URL('/admin', nextUrl));
        } else if (role === 'CREATOR') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        } else {
          return Response.redirect(new URL('/', nextUrl));
        }
      }

      if (isOnProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
