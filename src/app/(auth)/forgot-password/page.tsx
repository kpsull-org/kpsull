'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la demande.');
        return;
      }

      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      setError('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Entrez votre adresse email pour recevoir un code de réinitialisation"
      footer={{ text: 'Vous vous souvenez ?', linkText: 'Connexion', linkHref: '/login' }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" disabled={loading || !email} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Envoyer le code
        </Button>
      </form>
    </AuthCard>
  );
}
