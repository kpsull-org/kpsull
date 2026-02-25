import { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { CredentialsForm } from '@/components/auth/credentials-form';

export const metadata: Metadata = {
  title: 'Connexion | Kpsull',
  description: 'Connectez-vous à votre compte Kpsull',
};

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = callbackUrl ?? '/';

  return (
    <AuthCard
      title="Connexion"
      description="Connectez-vous a votre compte Kpsull"
      footer={{
        text: 'Pas encore de compte ?',
        linkText: "S'inscrire",
        linkHref: callbackUrl ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/signup',
      }}
    >
      <CredentialsForm mode="login" callbackUrl={safeCallbackUrl} />

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

      <GoogleSignInButton mode="signin" callbackUrl={safeCallbackUrl !== '/' ? safeCallbackUrl : '/auth/redirect'} />
    </AuthCard>
  );
}
