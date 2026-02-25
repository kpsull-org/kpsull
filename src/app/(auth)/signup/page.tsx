import { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { CredentialsForm } from '@/components/auth/credentials-form';

export const metadata: Metadata = {
  title: 'Inscription | Kpsull',
  description: 'Creez votre compte Kpsull pour commencer a vendre ou acheter',
};

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignupPage({ searchParams }: Readonly<Props>) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = callbackUrl ?? '/';

  return (
    <AuthCard
      title="Creer un compte"
      description="Rejoignez Kpsull pour decouvrir des creations uniques ou vendre les votres"
      footer={{
        text: 'Deja un compte ?',
        linkText: 'Se connecter',
        linkHref: callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login',
      }}
    >
      <CredentialsForm mode="signup" callbackUrl={safeCallbackUrl} />

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

      <GoogleSignInButton mode="signup" callbackUrl={safeCallbackUrl} />

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
