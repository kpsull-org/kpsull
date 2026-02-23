import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Checkout flow (Story 4.3)
 *
 * Tests the 4-step checkout: adresse → transporteur → paiement → confirmation.
 *
 * Route map:
 *   /checkout          → CheckoutPage (auth or stepper if authenticated)
 *   /checkout/shipping → ShippingAddressForm
 *   /checkout/carrier  → CarrierSelector + RelayPointSelector
 *   /checkout/payment  → Stripe Elements PaymentElement
 *   /checkout/confirmation?order=[id] → ConfirmationPage
 *
 * sessionStorage keys:
 *   guestCheckout      → { email, firstName, lastName }
 *   shippingAddress    → ShippingAddress (Zod-validated)
 *   selectedCarrier    → CarrierSelection (Zod-validated)
 *
 * Cart localStorage key: 'kpsull-cart'
 */

/** Helper: seed the Zustand cart in localStorage */
async function seedLocalStorageCart(
  page: import('@playwright/test').Page,
  items: {
    productId: string;
    variantId?: string;
    name: string;
    price: number;
    quantity: number;
    creatorSlug: string;
  }[]
) {
  await page.addInitScript((cartItems) => {
    localStorage.setItem('kpsull-cart', JSON.stringify({
      state: { items: cartItems },
      version: 0,
    }));
  }, items);
}

/** Helper: set sessionStorage values before page load */
async function seedSessionStorage(
  page: import('@playwright/test').Page,
  entries: Record<string, unknown>
) {
  await page.addInitScript((data) => {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  }, entries);
}

/** Helper: perform credentials login */
async function loginWithCredentials(
  page: import('@playwright/test').Page,
  email: string,
  password: string
) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL('/', { timeout: 15_000 });
}

/** A minimal valid cart item for checkout tests */
const TEST_CART_ITEM = {
  productId: 'checkout-product-001',
  name: 'Produit checkout test',
  price: 4990,
  quantity: 1,
  creatorSlug: 'test-creator',
};

/** A minimal valid shipping address matching the Zod schema */
const TEST_SHIPPING_ADDRESS = {
  firstName: 'Jean',
  lastName: 'Dupont',
  street: '12 rue de la Paix',
  streetComplement: '',
  city: 'Paris',
  postalCode: '75001',
  country: 'France',
  phone: '',
};

/** A minimal valid carrier selection (home delivery, no relay point) */
const TEST_CARRIER_CHRONOPOST = {
  carrier: 'chronopost',
  carrierName: 'Chronopost Express',
  price: 890,
  estimatedDays: 'J+1 ouvré avant 13h (domicile)',
};

// ---------------------------------------------------------------------------
// Scénario 1: Checkout guest complet (adresse → transporteur → paiement)
// ---------------------------------------------------------------------------
test.describe('Checkout — guest flow', () => {
  test('should redirect unauthenticated user to checkout auth page', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);

    await page.goto('/checkout');

    // Unauthenticated users see the CheckoutAuth component
    await expect(
      page.getByRole('heading', { name: /finaliser ma commande/i })
    ).toBeVisible({ timeout: 10_000 });

    // Should show "Se connecter" and "Commander en tant qu'invite" cards
    await expect(page.getByRole('heading', { name: /se connecter/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /commander en tant qu'invite/i })
    ).toBeVisible();
  });

  test('should proceed to shipping after filling guest checkout form', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await page.goto('/checkout');

    // Fill the guest form
    await page.getByLabel(/email/i).fill('guest@test.com');
    await page.locator('#firstName').fill('Jean');
    await page.locator('#lastName').fill('Dupont');

    // Click "Continuer" to proceed to shipping
    await page.getByRole('button', { name: /continuer/i }).click();

    // Should navigate to /checkout/shipping
    await page.waitForURL('/checkout/shipping', { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { name: /adresse de livraison/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should complete shipping form and proceed to carrier selection', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);

    // Skip the guest auth step by seeding sessionStorage directly
    await seedSessionStorage(page, {
      guestCheckout: {
        email: 'guest@test.com',
        firstName: 'Jean',
        lastName: 'Dupont',
      },
    });

    await page.goto('/checkout/shipping');

    // Wait for the form to render
    await expect(
      page.getByRole('heading', { name: /adresse de livraison/i })
    ).toBeVisible({ timeout: 10_000 });

    // The stepper should show current step as "Livraison"
    await expect(page.getByText('Livraison')).toBeVisible();

    // Fill in the shipping address form
    await page.locator('#firstName').fill('Jean');
    await page.locator('#lastName').fill('Dupont');
    await page.locator('#street').fill('12 rue de la Paix');
    await page.locator('#postalCode').fill('75001');
    await page.locator('#city').fill('Paris');

    // Submit the form
    await page.getByRole('button', { name: /continuer vers le paiement/i }).click();

    // Should navigate to /checkout/carrier
    await page.waitForURL('/checkout/carrier', { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { name: /mode de livraison/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show validation errors for invalid shipping form', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await seedSessionStorage(page, {
      guestCheckout: { email: 'guest@test.com', firstName: 'Jean', lastName: 'Dupont' },
    });

    await page.goto('/checkout/shipping');

    await expect(
      page.getByRole('heading', { name: /adresse de livraison/i })
    ).toBeVisible({ timeout: 10_000 });

    // Submit empty form
    await page.getByRole('button', { name: /continuer vers le paiement/i }).click();

    // Validation errors should appear for required fields
    await expect(page.getByText(/prenom requis/i)).toBeVisible();
    await expect(page.getByText(/nom requis/i)).toBeVisible();
    await expect(page.getByText(/adresse requise/i)).toBeVisible();
    await expect(page.getByText(/ville requise/i)).toBeVisible();
    await expect(page.getByText(/code postal requis/i)).toBeVisible();
  });

  test('should select a carrier and proceed to payment', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await seedSessionStorage(page, {
      shippingAddress: TEST_SHIPPING_ADDRESS,
    });

    await page.goto('/checkout/carrier');

    await expect(
      page.getByRole('heading', { name: /mode de livraison/i })
    ).toBeVisible({ timeout: 10_000 });

    // Select Chronopost Express (home delivery — no relay point needed)
    await page.locator('#carrier-chronopost').check();

    // Verify it is selected
    await expect(page.locator('#carrier-chronopost')).toBeChecked();

    // Click "Continuer vers le paiement"
    await page.getByRole('button', { name: /continuer vers le paiement/i }).click();

    // Should navigate to /checkout/payment
    await page.waitForURL('/checkout/payment', { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { name: /paiement/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show error when trying to continue without selecting a carrier', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await seedSessionStorage(page, {
      shippingAddress: TEST_SHIPPING_ADDRESS,
    });

    await page.goto('/checkout/carrier');

    await expect(
      page.getByRole('heading', { name: /mode de livraison/i })
    ).toBeVisible({ timeout: 10_000 });

    // Try to continue without selecting a carrier
    await page.getByRole('button', { name: /continuer vers le paiement/i }).click();

    // Should show error message
    await expect(
      page.getByText(/veuillez selectionner un transporteur/i)
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Scénario 2: Cart persistence cross-session (guest → login → CartSyncOnLogin)
// ---------------------------------------------------------------------------
test.describe('Checkout — cart persistence cross-session', () => {
  test('should display guest auth options on /checkout for unauthenticated user', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);

    await page.goto('/checkout');

    // The page should have both options
    await expect(
      page.getByRole('heading', { name: /se connecter/i })
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByRole('heading', { name: /commander en tant qu'invite/i })
    ).toBeVisible();
  });

  test('should redirect to /cart if cart is empty when accessing shipping page', async ({ page }) => {
    // Empty cart + valid session storage
    await page.addInitScript(() => {
      localStorage.removeItem('kpsull-cart');
      sessionStorage.setItem('guestCheckout', JSON.stringify({
        email: 'guest@test.com', firstName: 'Jean', lastName: 'Dupont',
      }));
    });

    await page.goto('/checkout/shipping');

    // With no items in cart, it redirects to /cart
    await page.waitForURL('/cart', { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { name: /votre panier est vide/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should redirect from carrier page to shipping when no shipping address set', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    // No shippingAddress in sessionStorage

    await page.goto('/checkout/carrier');

    // Should redirect to /checkout/shipping due to missing address
    await page.waitForURL('/checkout/shipping', { timeout: 10_000 });
  });

  test('should redirect from payment page to cart when cart is empty', async ({ page }) => {
    // Empty cart but valid session data
    await page.addInitScript(() => {
      localStorage.removeItem('kpsull-cart');
    });
    await seedSessionStorage(page, {
      shippingAddress: TEST_SHIPPING_ADDRESS,
      selectedCarrier: TEST_CARRIER_CHRONOPOST,
    });

    await page.goto('/checkout/payment');

    // Should redirect to /cart
    await page.waitForURL('/cart', { timeout: 10_000 });
  });

  test('should show login form and preserve cart context on /checkout', async ({ page }) => {
    test.skip(
      !process.env.E2E_TEST_USER_EMAIL,
      'Requires E2E_TEST_USER_EMAIL env var with valid credentials'
    );

    // Seed cart before login
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);

    // Navigate to login
    await loginWithCredentials(
      page,
      process.env.E2E_TEST_USER_EMAIL ?? '',
      process.env.E2E_TEST_USER_PASSWORD ?? ''
    );

    // Go to /checkout — authenticated users see the stepper directly
    await page.goto('/checkout');

    // For an authenticated user, the CheckoutStepper is rendered
    await expect(page.getByText('Livraison')).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Scénario 3: Relay point selection
// ---------------------------------------------------------------------------
test.describe('Checkout — relay point selection', () => {
  test('should show relay point selector when mondial-relay is selected', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await seedSessionStorage(page, {
      shippingAddress: TEST_SHIPPING_ADDRESS,
    });

    await page.goto('/checkout/carrier');

    await expect(
      page.getByRole('heading', { name: /mode de livraison/i })
    ).toBeVisible({ timeout: 10_000 });

    // Select Mondial Relay (a relay carrier)
    await page.locator('#carrier-mondial-relay').check();
    await expect(page.locator('#carrier-mondial-relay')).toBeChecked();

    // The RelayPointSelector should appear
    await expect(
      page.getByText(/selectionner un point mondial relay/i)
    ).toBeVisible({ timeout: 5_000 });

    // The postal code search input should be visible
    await expect(
      page.getByLabel(/code postal pour rechercher un point relais/i)
    ).toBeVisible();
  });

  test('should display 9 relay points for postal code 75001', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await seedSessionStorage(page, {
      shippingAddress: TEST_SHIPPING_ADDRESS,
    });

    await page.goto('/checkout/carrier');

    await expect(
      page.getByRole('heading', { name: /mode de livraison/i })
    ).toBeVisible({ timeout: 10_000 });

    // Select Mondial Relay to trigger RelayPointSelector
    await page.locator('#carrier-mondial-relay').check();

    // Wait for the relay point selector to appear
    await expect(
      page.getByLabel(/code postal pour rechercher un point relais/i)
    ).toBeVisible({ timeout: 5_000 });

    // Enter postal code 75001
    await page.getByLabel(/code postal pour rechercher un point relais/i).fill('75001');

    // Click "Rechercher"
    await page.getByRole('button', { name: /rechercher/i }).click();

    // Should display 9 relay points for the 75 prefix
    // Text format: "9 points relais trouvés près de 75001"
    await expect(
      page.getByText(/9 points? relais? trouv/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test('should allow selecting a relay point and confirm selection', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await seedSessionStorage(page, {
      shippingAddress: TEST_SHIPPING_ADDRESS,
    });

    await page.goto('/checkout/carrier');

    await expect(
      page.getByRole('heading', { name: /mode de livraison/i })
    ).toBeVisible({ timeout: 10_000 });

    // Select Mondial Relay
    await page.locator('#carrier-mondial-relay').check();

    await expect(
      page.getByLabel(/code postal pour rechercher un point relais/i)
    ).toBeVisible({ timeout: 5_000 });

    // Search for relay points
    await page.getByLabel(/code postal pour rechercher un point relais/i).fill('75001');
    await page.getByRole('button', { name: /rechercher/i }).click();

    // Wait for results
    await expect(page.getByText(/points? relais? trouv/i)).toBeVisible({ timeout: 5_000 });

    // Click the first relay point button
    const firstRelayPoint = page.locator('button[type="button"]').filter({
      hasText: /Tabac Presse Châtelet|Épicerie du Marais|Librairie République/,
    }).first();

    await firstRelayPoint.click();

    // The selected relay point summary shows in green
    await expect(
      page.locator('.bg-green-50').filter({ hasText: /Tabac Presse|Épicerie|Librairie/ })
    ).toBeVisible({ timeout: 5_000 });
  });

  test('should require relay point selection before continuing', async ({ page }) => {
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await seedSessionStorage(page, {
      shippingAddress: TEST_SHIPPING_ADDRESS,
    });

    await page.goto('/checkout/carrier');

    await expect(
      page.getByRole('heading', { name: /mode de livraison/i })
    ).toBeVisible({ timeout: 10_000 });

    // Select Mondial Relay (relay carrier) but do NOT select a relay point
    await page.locator('#carrier-mondial-relay').check();

    // Try to continue
    await page.getByRole('button', { name: /continuer vers le paiement/i }).click();

    // Should show error for missing relay point
    await expect(
      page.getByText(/veuillez selectionner un point relais/i)
    ).toBeVisible();
  });

  test('should show Stripe payment form when cart and address are valid', async ({ page }) => {
    test.skip(
      !process.env.E2E_STRIPE_ENABLED,
      'Requires E2E_STRIPE_ENABLED and a valid Stripe test key — skip in unit CI'
    );

    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await seedSessionStorage(page, {
      shippingAddress: TEST_SHIPPING_ADDRESS,
      selectedCarrier: TEST_CARRIER_CHRONOPOST,
    });

    await page.goto('/checkout/payment');

    await expect(
      page.getByRole('heading', { name: /paiement/i })
    ).toBeVisible({ timeout: 10_000 });

    // The "Paiement securise" section should be visible
    await expect(page.getByText(/paiement securise/i)).toBeVisible({ timeout: 10_000 });

    // Carrier info summary should be shown
    await expect(page.getByText('Chronopost Express')).toBeVisible({ timeout: 15_000 });

    // Stripe Elements iframe should appear
    const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
    await expect(stripeFrame.locator('input, [role="combobox"]').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('should show confirmation page after successful payment (Stripe test card)', async ({ page }) => {
    test.skip(
      !process.env.E2E_STRIPE_ENABLED,
      'Requires E2E_STRIPE_ENABLED, valid Stripe test key, and seeded test user'
    );

    test.skip(
      !process.env.E2E_TEST_USER_EMAIL,
      'Requires E2E_TEST_USER_EMAIL for authenticated checkout'
    );

    // Login first
    await loginWithCredentials(
      page,
      process.env.E2E_TEST_USER_EMAIL ?? '',
      process.env.E2E_TEST_USER_PASSWORD ?? ''
    );

    // Seed cart and session data
    await seedLocalStorageCart(page, [TEST_CART_ITEM]);
    await seedSessionStorage(page, {
      shippingAddress: TEST_SHIPPING_ADDRESS,
      selectedCarrier: TEST_CARRIER_CHRONOPOST,
    });

    await page.goto('/checkout/payment');

    // Wait for Stripe Elements to load
    await expect(page.getByText(/paiement securise/i)).toBeVisible({ timeout: 10_000 });

    // Fill Stripe test card: 4242 4242 4242 4242
    const cardFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
    await cardFrame.locator('[placeholder*="1234"]').fill('4242 4242 4242 4242');
    await cardFrame.locator('[placeholder*="MM / YY"]').fill('12 / 26');
    await cardFrame.locator('[placeholder*="CVC"]').fill('123');

    // Submit payment
    await page.getByRole('button', { name: /payer/i }).click();

    // After successful payment, Stripe redirects to /checkout/confirmation?order=...
    await page.waitForURL(/\/checkout\/confirmation/, { timeout: 30_000 });

    // Confirmation page should show success message
    await expect(
      page.getByRole('heading', { name: /merci pour votre commande/i })
    ).toBeVisible({ timeout: 15_000 });

    // Order ID should appear in the URL
    const url = page.url();
    expect(url).toContain('order=');
  });
});
