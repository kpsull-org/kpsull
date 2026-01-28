import { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

export const metadata: Metadata = {
  title: 'Connexion | Kpsull',
  description: 'Connectez-vous à votre compte Kpsull',
};

/**
 * Login page
 *
 * Allows users to sign in using Google OAuth.
 * Existing users are redirected to their dashboard based on their role.
 *
 * Acceptance Criteria (Story 1-2):
 * - AC5: Existing users are connected to their account and redirected to dashboard
 */
export default function LoginPage() {
  return (
    <AuthCard
      title="Connexion"
      description="Connectez-vous à votre compte Kpsull"
      footer={{
        text: 'Pas encore de compte ?',
        linkText: "S'inscrire",
        linkHref: '/signup',
      }}
    >
      <GoogleSignInButton mode="signin" callbackUrl="/dashboard" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Connexion sécurisée
          </span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Vos données sont protégées par une connexion OAuth sécurisée.
      </p>
    </AuthCard>
  );
}
