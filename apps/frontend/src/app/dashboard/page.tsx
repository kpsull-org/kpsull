"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login")
    }
  }, [session, isPending, router])

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/login")
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            Se déconnecter
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenue, {session.user.name || "Utilisateur"} !</CardTitle>
            <CardDescription>
              Voici les informations de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID</p>
              <p className="text-base font-mono text-sm">{session.user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email vérifié</p>
              <p className="text-base">{session.user.emailVerified ? "Oui" : "Non"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentification réussie</CardTitle>
            <CardDescription>
              Votre système d&apos;authentification fonctionne correctement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✅ BetterAuth configuré avec JWT</li>
              <li>✅ Providers Google et Apple configurés</li>
              <li>✅ Authentification par email/password</li>
              <li>✅ Gestion des rôles (Client/Créateur)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
