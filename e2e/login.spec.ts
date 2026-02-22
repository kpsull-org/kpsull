import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByText(/email/i)).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@test.com');
    await page.getByLabel(/mot de passe/i).fill('WrongPassword1!');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(
      page.getByText(/email ou mot de passe incorrect/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show service unavailable when DB is down', async ({ page }) => {
    // This test documents the expected behavior when the database is unreachable.
    // It requires the DB to actually be stopped to pass, so it's skipped in CI.
    test.skip(true, 'Requires DB to be stopped - manual verification only');

    await page.goto('/login');
    await page.getByLabel(/email/i).fill('user@test.com');
    await page.getByLabel(/mot de passe/i).fill('Password123!');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(
      page.getByText(/service temporairement indisponible/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should redirect to home after successful login', async ({ page }) => {
    // This test requires a seeded test user in the database.
    // Adjust credentials to match your seed data.
    test.skip(!process.env.E2E_TEST_USER_EMAIL, 'Requires E2E_TEST_USER_EMAIL env var');

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_USER_EMAIL ?? '');
    await page.getByLabel(/mot de passe/i).fill(process.env.E2E_TEST_USER_PASSWORD ?? '');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL('/', { timeout: 15_000 });
  });
});
