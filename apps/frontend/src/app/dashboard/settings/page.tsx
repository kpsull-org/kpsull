'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { Badge } from '@/components/ui/badge'
import { Mail, KeyRound, Link as LinkIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface LinkedAccount {
  provider: string
  accountId: string
  createdAt: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login')
    }
  }, [session, isPending, router])

  useEffect(() => {
    // Fetch user's linked accounts
    const fetchLinkedAccounts = async () => {
      try {
        // TODO: Implement API call to fetch linked accounts from BetterAuth
        // For now, we'll use a placeholder
        setLinkedAccounts([])
      } catch (err) {
        console.error('Error fetching linked accounts:', err)
      }
    }

    if (session?.user) {
      fetchLinkedAccounts()
    }
  }, [session])

  const handleLinkGoogle = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Use BetterAuth's linkSocial method
      await signIn.social({
        provider: 'google',
        callbackURL: '/dashboard/settings?linked=google',
      })
      setSuccess('Compte Google lié avec succès')
    } catch (err) {
      setError('Erreur lors de la liaison du compte Google')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const hasPassword = session?.user && 'password' in session.user
  const hasGoogleLinked = linkedAccounts.some((acc) => acc.provider === 'google')

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres du compte</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos informations personnelles et méthodes de connexion
          </p>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Vos informations de compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nom</p>
              <p className="text-sm text-muted-foreground">{session.user.name || 'Non défini'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Rôle</p>
              <Badge variant="secondary">{(session.user as any)?.role || 'USER'}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Connection Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Méthodes de connexion
            </CardTitle>
            <CardDescription>
              Gérez les différentes façons de vous connecter à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-500 bg-green-50 dark:bg-green-900/10 rounded-md">
                {success}
              </div>
            )}

            {/* Email/Password */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email et mot de passe</p>
                  <p className="text-sm text-muted-foreground">
                    {hasPassword ? 'Configuré' : 'Non configuré'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasPassword ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Activé
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Configurer
                  </Button>
                )}
              </div>
            </div>

            {/* Google OAuth */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <GoogleIcon size={20} />
                </div>
                <div>
                  <p className="font-medium">Google</p>
                  <p className="text-sm text-muted-foreground">
                    {hasGoogleLinked ? 'Compte lié' : 'Non lié'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasGoogleLinked ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Lié
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLinkGoogle} disabled={loading}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {loading ? 'Liaison...' : 'Lier le compte'}
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Astuce :</strong> Liez plusieurs méthodes de connexion pour accéder plus
                facilement à votre compte. Vous pourrez vous connecter avec n'importe quelle méthode
                liée.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="flex justify-start">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            ← Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  )
}
