'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { getRoleRedirectUrl } from '@/lib/utils/auth-redirect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { loginSchema, registerSchema } from '@/lib/schemas/auth.schema';

interface CredentialsFormProps {
  readonly mode: 'login' | 'signup';
  readonly callbackUrl?: string;
}

export function CredentialsForm({ mode, callbackUrl = '/' }: CredentialsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // Validate registration data
        const validation = registerSchema.safeParse(formData);
        if (!validation.success) {
          setFieldErrors(validation.error.flatten().fieldErrors);
          setIsLoading(false);
          return;
        }

        // Register user
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.fieldErrors) {
            setFieldErrors(data.fieldErrors);
          } else {
            setError(data.error || 'Erreur lors de la creation du compte');
          }
          setIsLoading(false);
          return;
        }

        // Success - sign in automatically
        setSuccess(data.linked
          ? 'Mot de passe ajoute! Connexion en cours...'
          : 'Compte cree! Connexion en cours...'
        );

        // Sign in with the new credentials
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError('Compte cree mais erreur de connexion. Veuillez vous connecter.');
          router.push('/login');
        } else if (data.requiresVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } else {
          router.refresh();
          const session = await getSession();
          router.push(callbackUrl !== '/' ? callbackUrl : getRoleRedirectUrl(session?.user?.role));
        }
      } else {
        // Login validation
        const validation = loginSchema.safeParse(formData);
        if (!validation.success) {
          setFieldErrors(validation.error.flatten().fieldErrors);
          setIsLoading(false);
          return;
        }

        // Sign in
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          if (result.error === 'CredentialsSignin') {
            setError('Email ou mot de passe incorrect');
          } else {
            setError('Service temporairement indisponible. Veuillez reessayer dans quelques instants.');
          }
          setIsLoading(false);
          return;
        }

        router.refresh();
        const session = await getSession();
        router.push(callbackUrl !== '/' ? callbackUrl : getRoleRedirectUrl(session?.user?.role));
      }
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Votre nom"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            className={fieldErrors.name ? 'border-destructive' : ''}
          />
          {fieldErrors.name && (
            <p className="text-sm text-destructive">{fieldErrors.name[0]}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="votre@email.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          autoComplete="email"
          className={fieldErrors.email ? 'border-destructive' : ''}
        />
        {fieldErrors.email && (
          <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={mode === 'signup' ? 'Min. 8 caracteres' : 'Votre mot de passe'}
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className={fieldErrors.password ? 'border-destructive pr-10' : 'pr-10'}
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
        {fieldErrors.password && (
          <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>
        )}
        {mode === 'signup' && !fieldErrors.password && (
          <p className="text-xs text-muted-foreground">
            8 caracteres min., 1 majuscule, 1 minuscule, 1 chiffre
          </p>
        )}
        {mode === 'login' && (
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        )}
      </div>

      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmez votre mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="new-password"
              className={fieldErrors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-sm text-destructive">{fieldErrors.confirmPassword[0]}</p>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === 'signup' ? 'Creation du compte...' : 'Connexion...'}
          </>
        ) : mode === 'signup' ? (
          'Creer mon compte'
        ) : (
          'Se connecter'
        )}
      </Button>
    </form>
  );
}
