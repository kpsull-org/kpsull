import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma/client';
import { loginSchema } from '@/lib/schemas/auth.schema';
import { authConfigEdge } from './config.edge';

/**
 * Full Auth.js configuration (server-only, NOT edge-safe).
 *
 * Extends the edge-safe config with Prisma-dependent providers and callbacks.
 * This is used by auth.ts for the full NextAuth instance (server components,
 * API routes, server actions). The middleware uses config.edge.ts instead.
 */

// Soft refresh interval: reload user data from DB every 15 minutes
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in ms

export const authConfig: NextAuthConfig = {
  ...authConfigEdge,
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
        const validation = loginSchema.safeParse(credentials);
        if (!validation.success) {
          return null;
        }

        const { email, password } = validation.data;

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email },
          });
        } catch (error) {
          console.error('[auth] Database unavailable during login:', error);
          Sentry.captureException(error);
          throw new Error('DatabaseUnavailable');
        }

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          accountTypeChosen: user.accountTypeChosen,
          wantsToBeCreator: user.wantsToBeCreator,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfigEdge.callbacks,

    async signIn({ account, profile }) {
      if (account?.provider === 'credentials') {
        return true;
      }

      if (account?.provider === 'google' && profile?.email) {
        const email = profile.email.toLowerCase();

        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true },
        });

        if (existingUser) {
          const googleLinked = existingUser.accounts.some(
            (a) => a.provider === 'google'
          );

          if (!googleLinked) {
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

            if (!existingUser.image && profile.picture) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  image: profile.picture as string,
                  emailVerified: new Date(),
                },
              });
            }
          }
        }

        return true;
      }

      // Block unknown providers
      return false;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountTypeChosen = user.accountTypeChosen;
        token.wantsToBeCreator = user.wantsToBeCreator;
        token.emailVerified = user.emailVerified ? new Date(user.emailVerified).toISOString() : null;
        token.refreshedAt = Date.now();
        return token;
      }

      const shouldRefresh =
        trigger === 'update' ||
        !token.refreshedAt ||
        Date.now() - (token.refreshedAt as number) > REFRESH_INTERVAL;

      if (shouldRefresh && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, accountTypeChosen: true, wantsToBeCreator: true, emailVerified: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.accountTypeChosen = dbUser.accountTypeChosen;
            token.wantsToBeCreator = dbUser.wantsToBeCreator;
            token.emailVerified = dbUser.emailVerified ? dbUser.emailVerified.toISOString() : null;
          }
        } catch {
          // DB unavailable: keep existing token data
        }
        token.refreshedAt = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'CLIENT' | 'CREATOR' | 'ADMIN';
        session.user.accountTypeChosen = token.accountTypeChosen as boolean;
        session.user.wantsToBeCreator = token.wantsToBeCreator as boolean;
        session.user.emailVerified = token.emailVerified ? new Date(token.emailVerified) : null;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};
