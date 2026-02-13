'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { OtpInput } from '@/components/auth/otp-input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail } from 'lucide-react';

const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Veuillez entrer le code complet.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la vérification.');
        return;
      }

      setSuccess('Email vérifié ! Redirection...');
      setTimeout(() => router.push('/'), 1500);
    } catch {
      setError('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }, [otp, email, router]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;

    setError('');
    try {
      const res = await fetch('/api/auth/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'email-verification' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors du renvoi.');
        return;
      }

      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(6).fill(''));
    } catch {
      setError('Erreur de connexion.');
    }
  }, [email, cooldown]);

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.every((d) => d !== '') && !loading) {
      handleVerify();
    }
  }, [otp, loading, handleVerify]);

  if (!email) {
    return (
      <AuthCard
        title="Vérification email"
        description="Adresse email manquante."
        footer={{ text: 'Retour', linkText: 'Connexion', linkHref: '/login' }}
      >
        <p className="text-center text-muted-foreground">
          Aucune adresse email fournie. Veuillez vous inscrire ou vous connecter.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Vérifiez votre email"
      description="Un code à 6 chiffres a été envoyé"
      footer={{ text: 'Retour', linkText: 'Connexion', linkHref: '/login' }}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Pour sécuriser votre compte, entrez le code envoyé à{' '}
            <strong className="text-foreground">{email}</strong>. Il expire dans 10 minutes.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50 text-green-700">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <OtpInput value={otp} onChange={setOtp} disabled={loading} />

        <Button onClick={handleVerify} disabled={loading || otp.join('').length !== 6} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Vérifier
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : 'Renvoyer le code'}
          </button>
        </div>
      </div>
    </AuthCard>
  );
}
