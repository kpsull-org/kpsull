import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page).toHaveTitle(/.*/)
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()
  })

  test('should display register page with account type selection', async ({ page }) => {
    await page.goto('/auth/register')

    await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()
    await expect(page.getByText(/client/i)).toBeVisible()
    await expect(page.getByText(/créateur/i)).toBeVisible()
  })

  test('should navigate to registration form after selecting account type', async ({ page }) => {
    await page.goto('/auth/register')

    // Click on Client account type
    await page
      .getByText(/client/i)
      .first()
      .click()

    // Should show registration form
    await expect(page.getByLabel(/nom complet/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^mot de passe$/i)).toBeVisible()
    await expect(page.getByLabel(/confirmer le mot de passe/i)).toBeVisible()
  })

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/auth/register')

    // Select account type
    await page
      .getByText(/client/i)
      .first()
      .click()

    // Fill in form with mismatched passwords
    await page.getByLabel(/nom complet/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/^mot de passe$/i).fill('password123')
    await page.getByLabel(/confirmer le mot de passe/i).fill('password456')

    // Submit form
    await page.getByRole('button', { name: /créer mon compte/i }).click()

    // Should show error message
    await expect(page.getByText(/les mots de passe ne correspondent pas/i)).toBeVisible()
  })

  test('should show error for short password', async ({ page }) => {
    await page.goto('/auth/register')

    // Select account type
    await page
      .getByText(/client/i)
      .first()
      .click()

    // Fill in form with short password
    await page.getByLabel(/nom complet/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/^mot de passe$/i).fill('short')
    await page.getByLabel(/confirmer le mot de passe/i).fill('short')

    // Submit form
    await page.getByRole('button', { name: /créer mon compte/i }).click()

    // Should show error message
    await expect(page.getByText(/au moins 8 caractères/i)).toBeVisible()
  })

  test('should show Google OAuth button', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/auth/login')

    // Click on register link
    await page.getByRole('link', { name: /s'inscrire/i }).click()

    // Should be on register page
    await expect(page).toHaveURL(/\/auth\/register/)
    await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()

    // Click on login link
    await page.getByRole('link', { name: /se connecter/i }).click()

    // Should be back on login page
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
  })

  test('should go back from registration form to account type selection', async ({ page }) => {
    await page.goto('/auth/register')

    // Select account type
    await page
      .getByText(/client/i)
      .first()
      .click()

    // Should show registration form
    await expect(page.getByLabel(/nom complet/i)).toBeVisible()

    // Click back button
    await page.getByRole('button', { name: /retour/i }).click()

    // Should be back at account type selection
    await expect(page.getByText(/choisissez le type de compte/i)).toBeVisible()
  })

  test('should display loading state when submitting login form', async ({ page }) => {
    await page.goto('/auth/login')

    // Fill in form
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/mot de passe/i).fill('password123')

    // Click submit button
    const submitButton = page.getByRole('button', { name: /se connecter/i })
    await submitButton.click()

    // Button should show loading text (though it will quickly show error)
    // This is a basic check that form submission is working
    await expect(page.getByLabel(/email/i)).toBeDisabled()
  })
})
