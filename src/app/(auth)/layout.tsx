import { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export const metadata: Metadata = {
  title: 'Authentification | Kpsull',
  description: 'Connectez-vous ou créez un compte pour accéder à Kpsull',
};

/**
 * Auth layout for authentication pages
 *
 * This layout is used for /login, /signup, and other auth-related pages.
 * It provides a centered, minimal layout for authentication forms.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="mb-8 text-primary transition-colors hover:opacity-80 kp-blur-in">
        <Logo size="lg" />
      </Link>
      <div className="w-full max-w-xl kp-luxury-reveal">{children}</div>
    </div>
  );
}
