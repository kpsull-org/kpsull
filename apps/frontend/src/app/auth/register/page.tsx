'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GoogleIcon } from '@/components/icons/GoogleIcon'

export const dynamic = 'force-dynamic'

type AccountType = 'USER' | 'CREATOR' | null

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'choose' | 'form'>('choose')
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type)
    setStep('form')
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Les validations de format sont déjà gérées par FormInput
    // On vérifie juste la correspondance des mots de passe
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      await signUp.email({
        email,
        password,
        name,
      })
      router.push('/dashboard')
    } catch (err) {
      const error = err as Error
      setError(error?.message || "Erreur lors de l'inscription")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      })
    } catch (err) {
      setError("Erreur lors de l'inscription avec Google")
      console.error(err)
      setLoading(false)
    }
  }

  if (step === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
            <CardDescription className="text-center">
              Choisissez le type de compte que vous souhaitez créer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleAccountTypeSelect('USER')}
              >
                <CardHeader>
                  <CardTitle className="text-xl">Client</CardTitle>
                  <CardDescription>Accédez aux services et contenus des créateurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Accès gratuit à la plateforme</li>
                    <li>• Découvrez les créateurs</li>
                    <li>• Profitez des contenus</li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary transition-colors border-primary/50"
                onClick={() => handleAccountTypeSelect('CREATOR')}
              >
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Créateur
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Payant
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Partagez votre contenu et monétisez votre audience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Créez et partagez du contenu</li>
                    <li>• Monétisez votre audience</li>
                    <li>• Outils d&apos;analyse avancés</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4">
                    3 formules disponibles (à configurer)
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground text-center w-full">
              Vous avez déjà un compte ?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => setStep('choose')} className="w-fit">
            ← Retour
          </Button>
          <CardTitle className="text-2xl font-bold text-center">
            Inscription {accountType === 'CREATOR' ? 'Créateur' : 'Client'}
          </CardTitle>
          <CardDescription className="text-center">
            Créez votre compte pour commencer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailRegister} className="space-y-4">
            <FormInput
              id="name"
              label="Nom complet"
              validationType="text"
              placeholder="Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
            <FormInput
              id="email"
              label="Email"
              validationType="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <FormInput
              id="password"
              label="Mot de passe"
              validationType="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <FormInput
              id="confirmPassword"
              label="Confirmer le mot de passe"
              validationType="confirmPassword"
              compareValue={password}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou continuer avec</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full"
          >
            <GoogleIcon size={18} />
            Google
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Vous avez déjà un compte ?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
