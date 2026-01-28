import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Auth.js configuration
 *
 * This file contains the configuration for Auth.js (NextAuth.js v5).
 * It configures:
 * - Google OAuth provider
 * - JWT session strategy
 * - Callbacks for enriching session with user role and id
 *
 * @see https://authjs.dev/getting-started/installation?framework=Next.js
 */
// Access token lifetime (15 minutes)
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes in seconds
// Refresh token/session lifetime (7 days)
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE, // 7 days (refresh token lifetime)
  },
  jwt: {
    maxAge: ACCESS_TOKEN_MAX_AGE, // 15 minutes (access token lifetime)
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    newUser: '/account-type', // Redirect new users to account type selection
  },
  callbacks: {
    /**
     * SignIn callback - Called when user signs in
     *
     * Returns true to allow sign in, false to deny, or a URL to redirect
     */
    async signIn({ account }) {
      // Allow OAuth sign-ins
      if (account?.provider === 'google') {
        return true;
      }
      return true;
    },

    /**
     * JWT callback - Enriches the token with user data
     *
     * Called when:
     * - User signs in (user object is available)
     * - Token is refreshed (only token is available)
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountTypeChosen = user.accountTypeChosen;
        token.wantsToBeCreator = user.wantsToBeCreator;
        // Set access token expiry time
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_MAX_AGE * 1000;
      }

      // Refresh user data from DB on update trigger
      if (trigger === 'update') {
        // Token will be refreshed on next request
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_MAX_AGE * 1000;
      }

      return token;
    },

    /**
     * Session callback - Enriches the session with user data from token
     *
     * Called whenever a session is checked (useSession, getServerSession)
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'CLIENT' | 'CREATOR' | 'ADMIN';
        session.user.accountTypeChosen = token.accountTypeChosen as boolean;
        session.user.wantsToBeCreator = token.wantsToBeCreator as boolean;
      }
      return session;
    },

    /**
     * Redirect callback - Controls where users are redirected after sign in/out
     */
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },

    /**
     * Authorized callback - Protects routes
     *
     * Called on every request to determine if the user is authorized
     */
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute = nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/profile') ||
        nextUrl.pathname.startsWith('/admin');
      const isAccountTypePage = nextUrl.pathname === '/account-type';
      const isAuthPage = nextUrl.pathname === '/login' || nextUrl.pathname === '/signup';

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && isAuthPage) {
        // Redirect based on role
        const role = auth.user.role;
        if (role === 'ADMIN') {
          return Response.redirect(new URL('/dashboard/admin', nextUrl));
        } else if (role === 'CREATOR') {
          return Response.redirect(new URL('/dashboard/creator', nextUrl));
        } else {
          return Response.redirect(new URL('/', nextUrl));
        }
      }

      // If logged in and hasn't chosen account type, redirect to account-type page
      if (isLoggedIn && !auth.user.accountTypeChosen && !isAccountTypePage && !isAuthPage) {
        return Response.redirect(new URL('/account-type', nextUrl));
      }

      // If logged in and has already chosen, redirect away from account-type page
      if (isLoggedIn && auth.user.accountTypeChosen && isAccountTypePage) {
        // Redirect based on role
        const role = auth.user.role;
        if (role === 'ADMIN') {
          return Response.redirect(new URL('/dashboard/admin', nextUrl));
        } else if (role === 'CREATOR') {
          return Response.redirect(new URL('/dashboard/creator', nextUrl));
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
};
