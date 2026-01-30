import { auth } from '@/lib/auth/auth';
import { CheckoutAuth } from '@/components/checkout/checkout-auth';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';

/**
 * Checkout Page
 *
 * Story 7-3: Authentification checkout
 *
 * Acceptance Criteria:
 * - AC1: Redirige vers connexion si non authentifié et option guest
 * - AC2: Affiche formulaire guest (email, nom)
 * - AC3: Option de connexion avec Google
 * - AC4: Conserve le panier après connexion
 * - AC5: Passe à l'étape suivante si authentifié
 */
export default async function CheckoutPage() {
  const session = await auth();

  // If user is authenticated, show the checkout stepper
  if (session?.user) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Finaliser ma commande</h1>
        <CheckoutStepper
          currentStep="shipping"
          user={{
            id: session.user.id,
            name: session.user.name ?? undefined,
            email: session.user.email ?? '',
          }}
        />
      </div>
    );
  }

  // If not authenticated, show auth/guest options
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Finaliser ma commande</h1>
      <CheckoutAuth />
    </div>
  );
}
