'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

interface GuestInfo {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * CheckoutAuth component
 *
 * Allows users to either:
 * - Sign in with Google (preserves cart)
 * - Continue as guest with email and name
 */
export function CheckoutAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Partial<GuestInfo>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<GuestInfo> = {};

    if (!guestInfo.email) {
      newErrors.email = 'Email requis';
    } else if (!validateEmail(guestInfo.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!guestInfo.firstName.trim()) {
      newErrors.firstName = 'Prenom requis';
    }

    if (!guestInfo.lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuestCheckout = () => {
    if (!validateForm()) return;

    setIsLoading(true);

    // Store guest info in session storage for checkout
    sessionStorage.setItem('guestCheckout', JSON.stringify(guestInfo));

    // Navigate to shipping step
    router.push('/checkout/shipping');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Google Sign In Option */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Se connecter</CardTitle>
          <CardDescription>
            Connectez-vous pour retrouver vos commandes et suivre vos livraisons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton
            mode="signin"
            callbackUrl="/checkout"
          />
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground justify-center">
          Votre panier sera conserve apres la connexion
        </CardFooter>
      </Card>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer sans compte
          </span>
        </div>
      </div>

      {/* Guest Checkout Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Commander en tant qu&apos;invite</CardTitle>
          <CardDescription>
            Pas de compte necessaire pour passer commande
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                className="pl-10"
                value={guestInfo.email}
                onChange={(e) =>
                  setGuestInfo((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prenom *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Jean"
                  className="pl-10"
                  value={guestInfo.firstName}
                  onChange={(e) =>
                    setGuestInfo((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Dupont"
                value={guestInfo.lastName}
                onChange={(e) =>
                  setGuestInfo((prev) => ({ ...prev, lastName: e.target.value }))
                }
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGuestCheckout}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Chargement...' : 'Continuer'}
          </Button>
        </CardFooter>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        En continuant, vous acceptez nos conditions generales de vente et notre
        politique de confidentialite.
      </p>
    </div>
  );
}
