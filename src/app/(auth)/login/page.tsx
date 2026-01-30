import { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { CredentialsForm } from '@/components/auth/credentials-form';

export const metadata: Metadata = {
  title: 'Connexion | Kpsull',
  description: 'Connectez-vous à votre compte Kpsull',
};

/**
 * Login page
 *
 * Allows users to sign in using:
 * - Email/password credentials
 * - Google OAuth
 *
 * Accounts with the same email are automatically linked.
 */
export default function LoginPage() {
  return (
    <AuthCard
      title="Connexion"
      description="Connectez-vous a votre compte Kpsull"
      footer={{
        text: 'Pas encore de compte ?',
        linkText: "S'inscrire",
        linkHref: '/signup',
      }}
    >
      <CredentialsForm mode="login" callbackUrl="/account-type" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            ou continuer avec
          </span>
        </div>
      </div>

      <GoogleSignInButton mode="signin" callbackUrl="/account-type" />
    </AuthCard>
  );
}
