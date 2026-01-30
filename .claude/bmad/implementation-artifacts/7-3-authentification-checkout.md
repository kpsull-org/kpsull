# Story 7.3: Authentification pour Checkout

Status: ready-for-dev

## Story

As a visiteur avec un panier,
I want m'identifier pour finaliser ma commande,
so that je puisse proceder au paiement.

## Acceptance Criteria

1. **AC1 - Redirection login si non connecte**
   - **Given** un visiteur non connecte avec un panier non vide
   - **When** il clique sur "Passer la commande" ou accede a /checkout
   - **Then** il est redirige vers la page de connexion
   - **And** l'URL de retour est preservee (/checkout)

2. **AC2 - Retour au checkout apres connexion**
   - **Given** un visiteur redirige vers la connexion depuis le checkout
   - **When** il se connecte avec succes (Google ou email)
   - **Then** il est automatiquement redirige vers /checkout
   - **And** son panier localStorage est synchronise avec son compte

3. **AC3 - Panier intact apres connexion**
   - **Given** un visiteur avec un panier en localStorage
   - **When** il se connecte a son compte
   - **Then** tous les articles du panier sont conserves
   - **And** si un panier serveur existait, les articles sont fusionnes

4. **AC4 - Informations pre-remplies**
   - **Given** un Client connecte avec des informations de profil
   - **When** il accede au checkout
   - **Then** son nom et email sont pre-remplis
   - **And** ses adresses enregistrees sont proposees

5. **AC5 - Acces direct si connecte**
   - **Given** un Client deja connecte avec un panier non vide
   - **When** il clique sur "Passer la commande"
   - **Then** il accede directement a /checkout sans redirection

## Tasks / Subtasks

- [ ] **Task 1: Proteger la route checkout** (AC: #1, #5)
  - [ ] 1.1 Creer le middleware de protection pour /checkout
  - [ ] 1.2 Gerer la redirection avec callbackUrl
  - [ ] 1.3 Verifier que le panier n'est pas vide

- [ ] **Task 2: Configurer le callback Auth.js** (AC: #2)
  - [ ] 2.1 Mettre a jour la configuration Auth.js pour gerer le redirect
  - [ ] 2.2 Tester le flow Google OAuth avec callbackUrl
  - [ ] 2.3 Tester le flow email/password avec callbackUrl

- [ ] **Task 3: Implementer la synchronisation panier post-login** (AC: #3)
  - [ ] 3.1 Creer un hook useCartSync pour declencher la sync apres login
  - [ ] 3.2 Appeler l'API /api/cart/sync automatiquement
  - [ ] 3.3 Mettre a jour le store local avec les donnees fusionnees

- [ ] **Task 4: Pre-remplir les informations checkout** (AC: #4)
  - [ ] 4.1 Charger les donnees utilisateur sur la page checkout
  - [ ] 4.2 Charger les adresses enregistrees
  - [ ] 4.3 Pre-selectionner l'adresse par defaut

- [ ] **Task 5: Creer la page de connexion checkout** (AC: #1, #2)
  - [ ] 5.1 Creer `src/app/(auth)/login/page.tsx` avec support callbackUrl
  - [ ] 5.2 Afficher le message contextuel "Connectez-vous pour finaliser"
  - [ ] 5.3 Afficher le resume du panier (optionnel)

- [ ] **Task 6: Ecrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests E2E pour le flow redirection login
  - [ ] 6.2 Tests pour la synchronisation panier
  - [ ] 6.3 Tests pour les informations pre-remplies

## Dev Notes

### Middleware Protection Checkout

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger /checkout
  if (pathname.startsWith("/checkout")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("message", "checkout");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*"],
};
```

### Page Login avec Support Checkout

```typescript
// src/app/(auth)/login/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    message?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  // Si deja connecte, rediriger
  if (session) {
    redirect(params.callbackUrl || "/");
  }

  const isCheckoutFlow = params.message === "checkout";
  const callbackUrl = params.callbackUrl || "/";

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isCheckoutFlow && (
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
          )}

          <CardTitle className="text-2xl">
            {isCheckoutFlow ? "Connectez-vous pour continuer" : "Connexion"}
          </CardTitle>

          <CardDescription>
            {isCheckoutFlow
              ? "Identifiez-vous pour finaliser votre commande"
              : "Connectez-vous a votre compte Kpsull"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Suspense fallback={<div>Chargement...</div>}>
            <LoginForm callbackUrl={callbackUrl} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Composant LoginForm avec OAuth

```typescript
// src/components/auth/login-form.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart.store";

interface LoginFormProps {
  callbackUrl: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const items = useCartStore((state) => state.items);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    // Stocker temporairement les items pour la sync post-login
    if (items.length > 0) {
      sessionStorage.setItem("pendingCartSync", JSON.stringify(items));
    }

    await signIn("google", { callbackUrl });
  };

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continuer avec Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou
          </span>
        </div>
      </div>

      {/* Formulaire email/password optionnel */}
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <a href="/register" className="underline underline-offset-4 hover:text-primary">
          Inscrivez-vous
        </a>
      </p>
    </div>
  );
}
```

### Hook useCartSync

```typescript
// src/lib/hooks/use-cart-sync.ts
"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/stores/cart.store";

export function useCartSync() {
  const { data: session, status } = useSession();
  const hasSynced = useRef(false);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    const syncCart = async () => {
      // Eviter les syncs multiples
      if (hasSynced.current || status !== "authenticated" || !session?.user) {
        return;
      }

      // Verifier s'il y a des items en attente de sync
      const pendingSync = sessionStorage.getItem("pendingCartSync");
      if (!pendingSync) {
        return;
      }

      try {
        const items = JSON.parse(pendingSync);
        if (items.length === 0) {
          return;
        }

        const response = await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          }),
        });

        if (response.ok) {
          // Nettoyer les donnees locales
          sessionStorage.removeItem("pendingCartSync");
          hasSynced.current = true;

          // Optionnel: mettre a jour le store avec les donnees serveur
          const { cart } = await response.json();
          // ... mettre a jour le store si necessaire
        }
      } catch (error) {
        console.error("Cart sync error:", error);
      }
    };

    syncCart();
  }, [session, status, clearCart]);
}
```

### Layout Checkout avec Pre-remplissage

```typescript
// src/app/(checkout)/checkout/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout&message=checkout");
  }

  // Charger les donnees utilisateur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: {
        orderBy: { isDefault: "desc" },
      },
    },
  });

  const defaultAddress = user?.addresses.find((a) => a.isDefault) || user?.addresses[0];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Finaliser la commande</h1>

      <CheckoutForm
        user={{
          id: user?.id || session.user.id,
          name: user?.name || session.user.name || "",
          email: user?.email || session.user.email || "",
        }}
        addresses={user?.addresses || []}
        defaultAddressId={defaultAddress?.id}
      />
    </div>
  );
}
```

### Provider Cart Sync

```typescript
// src/components/providers/cart-sync-provider.tsx
"use client";

import { useCartSync } from "@/lib/hooks/use-cart-sync";

export function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}
```

### References

- [Source: architecture.md#Auth Flow]
- [Source: prd.md#FR32, FR33]
- [Source: epics.md#Story 7.3]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
