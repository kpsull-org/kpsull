import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">KpSull</h1>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Créer un compte</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">Bienvenue sur KpSull</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Plateforme de connexion entre créateurs et clients avec authentification sécurisée
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités</CardTitle>
                <CardDescription>Ce qui est déjà disponible</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Authentification avec BetterAuth</li>
                  <li>✅ Connexion Email/Password</li>
                  <li>✅ OAuth Google & Apple (configuré)</li>
                  <li>✅ Gestion des rôles (Client/Créateur)</li>
                  <li>✅ Interface avec shadcn/ui</li>
                  <li>✅ Next.js 15 + TypeScript</li>
                  <li>✅ Tailwind CSS 4</li>
                  <li>✅ Base de données PostgreSQL + Prisma</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prochaines étapes</CardTitle>
                <CardDescription>À développer</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Plans payants pour créateurs (3 formules)</li>
                  <li>• Dashboard créateur avancé</li>
                  <li>• Système de paiement</li>
                  <li>• Gestion de contenu</li>
                  <li>• Analytics et statistiques</li>
                  <li>• Messagerie entre utilisateurs</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center space-y-4 pt-8">
            <p className="text-muted-foreground">Prêt à commencer ?</p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg">Créer un compte gratuit</Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>KpSull - Plateforme de création de contenu</p>
        </div>
      </footer>
    </div>
  )
}
