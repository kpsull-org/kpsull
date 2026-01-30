import { Metadata } from 'next';

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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
