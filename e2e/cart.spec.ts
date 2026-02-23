import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Cart (Story 4.3)
 *
 * Tests the Zustand cart store with localStorage persistence (guest)
 * and DB sync on login (authenticated).
 *
 * Cart localStorage key: 'kpsull-cart'
 * Cart page: /cart
 * Catalogue: /catalogue (products linked to /catalogue/[productId])
 *
 * NOTE: These tests require a running server with seeded products.
 * Tests that depend on DB data (auth, seeded products) are guarded
 * by environment variable checks.
 */

/** Helper: seed the Zustand cart directly in localStorage before page load */
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
    const cartState = {
      state: { items: cartItems },
      version: 0,
    };
    localStorage.setItem('kpsull-cart', JSON.stringify(cartState));
  }, items);
}

/** Helper: read the raw cart state from localStorage */
async function readLocalStorageCart(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('kpsull-cart');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { state: { items: unknown[] } };
    } catch {
      return null;
    }
  });
}

/** Helper: perform credentials login via the login page */
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

// ---------------------------------------------------------------------------
// Scénario 1: Ajout produit non authentifié → localStorage persiste après refresh
// ---------------------------------------------------------------------------
test.describe('Cart — guest persistence', () => {
  test('should persist cart items in localStorage after page reload', async ({ page }) => {
    // Seed a cart item directly in localStorage before navigating
    await seedLocalStorageCart(page, [
      {
        productId: 'test-product-001',
        name: 'Produit test',
        price: 2990,
        quantity: 1,
        creatorSlug: 'test-creator',
      },
    ]);

    await page.goto('/cart');

    // Wait for hydration — the cart page shows skeleton then real content
    await page.waitForSelector('h1', { timeout: 10_000 });

    // The cart should show the seeded item (not empty cart)
    await expect(page.getByRole('heading', { name: /mon panier/i })).toBeVisible({ timeout: 10_000 });

    // Check the item name is displayed
    await expect(page.getByText('Produit test')).toBeVisible();

    // Reload the page to verify persistence
    await page.reload();

    // After reload, cart must still be populated
    await expect(page.getByRole('heading', { name: /mon panier/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Produit test')).toBeVisible();

    // localStorage should still contain the cart data
    const cart = await readLocalStorageCart(page);
    expect(cart).not.toBeNull();
    expect(cart?.state.items).toHaveLength(1);
  });

  test('should show empty cart when localStorage has no items', async ({ page }) => {
    // Ensure no cart in localStorage
    await page.addInitScript(() => {
      localStorage.removeItem('kpsull-cart');
    });

    await page.goto('/cart');

    // Should render the empty cart state
    await expect(
      page.getByRole('heading', { name: /votre panier est vide/i })
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByRole('link', { name: /decouvrir les createurs/i })
    ).toBeVisible();
  });

  test('should navigate to catalogue and display Add to cart button', async ({ page }) => {
    await page.goto('/catalogue');

    // At least one product card should be visible in the grid
    const firstProductLink = page.locator('a[href^="/catalogue/"]').first();

    const isVisible = await firstProductLink.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip(true, 'No products seeded in the catalogue');
      return;
    }

    await firstProductLink.click();
    await page.waitForURL(/\/catalogue\//, { timeout: 10_000 });

    // Product detail page should have the Add to cart button
    const addToCartButton = page.getByRole('button', { name: /ajouter au panier/i });
    await expect(addToCartButton).toBeVisible({ timeout: 10_000 });
  });

  test('should add product to cart from catalogue and see it in /cart', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('kpsull-cart');
    });

    await page.goto('/catalogue');

    const firstProductLink = page.locator('a[href^="/catalogue/"]').first();
    const isVisible = await firstProductLink.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip(true, 'No products seeded in the catalogue');
      return;
    }

    await firstProductLink.click();
    await page.waitForURL(/\/catalogue\//, { timeout: 10_000 });

    // If the product has sizes, select the first available one
    const sizeButtons = page.locator('button[disabled=false]').filter({
      hasText: /^(XS|S|M|L|XL|XXL|[0-9]{1,2})$/,
    });
    const hasSizes = await sizeButtons.first().isVisible().catch(() => false);
    if (hasSizes) {
      await sizeButtons.first().click();
    }

    // Click "Ajouter au panier"
    const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i });
    await addToCartBtn.click();

    // Navigate to /cart to confirm the item was added
    await page.goto('/cart');
    await expect(
      page.getByRole('heading', { name: /mon panier/i })
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Scénario 2: Modifier quantité → persisté après refresh
// ---------------------------------------------------------------------------
test.describe('Cart — quantity update persistence', () => {
  test('should persist quantity changes after page reload', async ({ page }) => {
    // Seed cart with 1 item
    await seedLocalStorageCart(page, [
      {
        productId: 'prod-qty-test',
        name: 'Article quantite test',
        price: 5000,
        quantity: 1,
        creatorSlug: 'creator-test',
      },
    ]);

    await page.goto('/cart');

    // Wait for cart to hydrate
    await expect(page.getByRole('heading', { name: /mon panier/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Article quantite test')).toBeVisible();

    // The quantity input has aria-label="Quantite"
    const quantityInput = page.getByLabel('Quantite').first();
    await expect(quantityInput).toBeVisible();
    await expect(quantityInput).toHaveValue('1');

    // Increase quantity using the "Augmenter la quantite" button
    const increaseBtn = page.getByRole('button', { name: /augmenter la quantite/i }).first();
    await increaseBtn.click();
    await expect(quantityInput).toHaveValue('2');

    // Reload the page
    await page.reload();

    // After reload, the quantity should still be 2
    await expect(page.getByRole('heading', { name: /mon panier/i })).toBeVisible({ timeout: 10_000 });

    const quantityAfterReload = page.getByLabel('Quantite').first();
    await expect(quantityAfterReload).toHaveValue('2');

    // Verify localStorage reflects the update
    const cart = await readLocalStorageCart(page);
    expect(cart?.state.items[0]).toMatchObject({
      productId: 'prod-qty-test',
      quantity: 2,
    });
  });

  test('should remove item when clicking delete button', async ({ page }) => {
    await seedLocalStorageCart(page, [
      {
        productId: 'prod-remove-test',
        name: 'Article a supprimer',
        price: 3000,
        quantity: 1,
        creatorSlug: 'creator-test',
      },
    ]);

    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: /mon panier/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Article a supprimer')).toBeVisible();

    // Click the delete button (aria-label="Supprimer l'article")
    const removeBtn = page.getByRole('button', { name: /supprimer l'article/i }).first();
    await removeBtn.click();

    // Cart should now be empty
    await expect(
      page.getByRole('heading', { name: /votre panier est vide/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show cart summary with correct total', async ({ page }) => {
    await seedLocalStorageCart(page, [
      {
        productId: 'prod-total-a',
        name: 'Produit A',
        price: 2000, // 20.00 €
        quantity: 2,
        creatorSlug: 'creator-test',
      },
      {
        productId: 'prod-total-b',
        name: 'Produit B',
        price: 3000, // 30.00 €
        quantity: 1,
        creatorSlug: 'creator-test',
      },
    ]);

    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: /mon panier/i })).toBeVisible({ timeout: 10_000 });

    // The CartSummary displays "Resume de la commande"
    await expect(page.getByText(/resume de la commande/i)).toBeVisible();

    // Total = 2*2000 + 3000 = 7000 cents = 70 €
    await expect(page.getByText(/70/)).toBeVisible();

    // The checkout CTA button should be present
    await expect(
      page.getByRole('link', { name: /passer la commande/i })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Scénario 3: Login → CartSyncOnLogin → items sauvegardés en DB (vérifier via UI)
// ---------------------------------------------------------------------------
test.describe('Cart — sync on login', () => {
  test('should sync localStorage cart to DB after login', async ({ page }) => {
    test.skip(
      !process.env.E2E_TEST_USER_EMAIL,
      'Requires E2E_TEST_USER_EMAIL env var to be set with valid credentials'
    );

    // 1. Seed localStorage with guest cart items before any navigation
    await seedLocalStorageCart(page, [
      {
        productId: 'sync-product-001',
        name: 'Produit a synchroniser',
        price: 4500,
        quantity: 1,
        creatorSlug: 'test-creator',
      },
    ]);

    // 2. Verify localStorage has the guest cart
    await page.goto('/');
    const cartBeforeLogin = await readLocalStorageCart(page);
    expect(cartBeforeLogin?.state.items).toHaveLength(1);

    // 3. Login — CartSyncOnLogin component will fire and save to DB
    await loginWithCredentials(
      page,
      process.env.E2E_TEST_USER_EMAIL ?? '',
      process.env.E2E_TEST_USER_PASSWORD ?? ''
    );

    // 4. Wait for CartSyncOnLogin to fire (triggered on mount with isAuthenticated=true)
    await page.waitForFunction(
      () => !localStorage.getItem('kpsull-cart'),
      { timeout: 10_000 }
    );

    // 5. Navigate to /cart — cart is now DB-backed
    await page.goto('/cart');

    // The cart should still contain the synced item
    await expect(
      page.getByRole('heading', { name: /mon panier/i })
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Produit a synchroniser')).toBeVisible({ timeout: 10_000 });
  });

  test('should display cart items fetched from DB for authenticated user', async ({ page }) => {
    test.skip(
      !process.env.E2E_TEST_USER_EMAIL,
      'Requires E2E_TEST_USER_EMAIL env var to be set with valid credentials'
    );

    // Login without any local cart
    await page.addInitScript(() => {
      localStorage.removeItem('kpsull-cart');
    });

    await loginWithCredentials(
      page,
      process.env.E2E_TEST_USER_EMAIL ?? '',
      process.env.E2E_TEST_USER_PASSWORD ?? ''
    );

    await page.goto('/cart');

    // Should render either the cart with items or the empty state — not a crash
    const hasCart = await page
      .getByRole('heading', { name: /mon panier/i })
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByRole('heading', { name: /votre panier est vide/i })
      .isVisible()
      .catch(() => false);

    expect(hasCart || hasEmpty).toBe(true);
  });
});
