import { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

export const metadata: Metadata = {
  title: 'Inscription | Kpsull',
  description: 'Créez votre compte Kpsull pour commencer à vendre ou acheter',
};

/**
 * Signup page
 *
 * Allows users to create a new account using Google OAuth.
 * After successful signup, users are redirected to the account type selection page.
 *
 * Acceptance Criteria (Story 1-2):
 * - AC1: Button "S'inscrire avec Google" is visible and functional
 * - AC2: Clicking redirects to Google OAuth consent screen
 * - AC3: After auth, user is created with role CLIENT and redirected to account-type
 */
export default function SignupPage() {
  return (
    <AuthCard
      title="Créer un compte"
      description="Rejoignez Kpsull pour découvrir des créations uniques ou vendre les vôtres"
      footer={{
        text: 'Déjà un compte ?',
        linkText: 'Se connecter',
        linkHref: '/login',
      }}
    >
      <GoogleSignInButton mode="signup" callbackUrl="/account-type" />

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
        En vous inscrivant, vous acceptez nos{' '}
        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
          conditions d&apos;utilisation
        </a>{' '}
        et notre{' '}
        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
          politique de confidentialité
        </a>
        .
      </p>
    </AuthCard>
  );
}
