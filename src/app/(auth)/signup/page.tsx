import { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { CredentialsForm } from '@/components/auth/credentials-form';

export const metadata: Metadata = {
  title: 'Inscription | Kpsull',
  description: 'Creez votre compte Kpsull pour commencer a vendre ou acheter',
};

/**
 * Signup page
 *
 * Allows users to create a new account using:
 * - Email/password credentials
 * - Google OAuth
 *
 * If an account exists with the same email (from Google), the password is added
 * to enable both login methods.
 */
export default function SignupPage() {
  return (
    <AuthCard
      title="Creer un compte"
      description="Rejoignez Kpsull pour decouvrir des creations uniques ou vendre les votres"
      footer={{
        text: 'Deja un compte ?',
        linkText: 'Se connecter',
        linkHref: '/login',
      }}
    >
      <CredentialsForm mode="signup" callbackUrl="/account-type" />

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

      <GoogleSignInButton mode="signup" callbackUrl="/account-type" />

      <p className="text-center text-sm text-muted-foreground">
        En vous inscrivant, vous acceptez nos{' '}
        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
          conditions d&apos;utilisation
        </a>{' '}
        et notre{' '}
        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
          politique de confidentialite
        </a>
        .
      </p>
    </AuthCard>
  );
}
