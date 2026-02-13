'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { OtpInput } from '@/components/auth/otp-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react';

const RESEND_COOLDOWN = 60;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleReset = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Veuillez entrer le code complet.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la réinitialisation.');
        return;
      }

      setSuccess('Mot de passe modifié ! Redirection vers la connexion...');
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }, [otp, password, email, router]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;

    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur lors du renvoi.');
        return;
      }

      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(6).fill(''));
    } catch {
      setError('Erreur de connexion.');
    }
  }, [email, cooldown]);

  if (!email) {
    return (
      <AuthCard
        title="Réinitialiser le mot de passe"
        description="Adresse email manquante."
        footer={{ text: 'Retour', linkText: 'Mot de passe oublié', linkHref: '/forgot-password' }}
      >
        <p className="text-center text-muted-foreground">
          Aucune adresse email fournie.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Réinitialiser le mot de passe"
      description="Entrez le code reçu et votre nouveau mot de passe"
      footer={{ text: 'Retour', linkText: 'Connexion', linkHref: '/login' }}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Un code a été envoyé à <strong className="text-foreground">{email}</strong>.
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

        <div className="space-y-2">
          <Label>Code de vérification</Label>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
          </p>
        </div>

        <Button
          onClick={handleReset}
          disabled={loading || otp.join('').length !== 6 || password.length < 8}
          className="w-full"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Réinitialiser le mot de passe
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthCard
        title="Réinitialiser le mot de passe"
        description="Chargement..."
      >
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthCard>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
