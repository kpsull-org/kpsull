import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma/client';
import { loginSchema } from '@/lib/schemas/auth.schema';

/**
 * Auth.js configuration
 *
 * This file contains the configuration for Auth.js (NextAuth.js v5).
 * It configures:
 * - Google OAuth provider
 * - Credentials provider (email/password)
 * - JWT session strategy
 * - Callbacks for enriching session with user role and id
 * - Automatic account linking (Google + credentials on same email)
 *
 * @see https://authjs.dev/getting-started/installation?framework=Next.js
 */
// Session/JWT lifetime (7 days)
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
// Soft refresh interval: reload user data from DB every 15 minutes
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in ms

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        // Validate credentials format
        const validation = loginSchema.safeParse(credentials);
        if (!validation.success) {
          return null;
        }

        const { email, password } = validation.data;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // User not found or no password set (OAuth-only user)
        if (!user || !user.hashedPassword) {
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) {
          return null;
        }

        // Return user object for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          accountTypeChosen: user.accountTypeChosen,
          wantsToBeCreator: user.wantsToBeCreator,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE, // 7 days
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    // newUser not needed — creators go through /devenir-createur voluntarily
  },
  callbacks: {
    /**
     * SignIn callback - Called when user signs in
     *
     * Handles automatic account linking:
     * - When signing in with Google, if a user with the same email exists
     *   (created via credentials), the Google account is automatically linked.
     */
    async signIn({ account, profile }) {
      // Allow credentials sign-ins
      if (account?.provider === 'credentials') {
        return true;
      }

      // Handle Google OAuth sign-ins with account linking
      if (account?.provider === 'google' && profile?.email) {
        const email = profile.email.toLowerCase();

        // Check if user with same email exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true },
        });

        if (existingUser) {
          // Check if Google account is already linked
          const googleLinked = existingUser.accounts.some(
            (a) => a.provider === 'google'
          );

          if (!googleLinked) {
            // Link Google account to existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });

            // Update user info if not already set
            if (!existingUser.image && profile.picture) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  image: profile.picture as string,
                  emailVerified: new Date(), // Google verified the email
                },
              });
            }
          }
        }

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
      // Initial sign-in: populate token from user object
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountTypeChosen = user.accountTypeChosen;
        token.wantsToBeCreator = user.wantsToBeCreator;
        token.refreshedAt = Date.now();
        return token;
      }

      // Soft refresh: reload user data from DB periodically
      const shouldRefresh =
        trigger === 'update' ||
        !token.refreshedAt ||
        Date.now() - (token.refreshedAt as number) > REFRESH_INTERVAL;

      if (shouldRefresh && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, accountTypeChosen: true, wantsToBeCreator: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.accountTypeChosen = dbUser.accountTypeChosen;
            token.wantsToBeCreator = dbUser.wantsToBeCreator;
          }
        } catch {
          // DB unavailable: keep existing token data
        }
        token.refreshedAt = Date.now();
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

      if (isOnProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      return true;
    },
  },
};
