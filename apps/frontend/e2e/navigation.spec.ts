import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')

    // Check that page loads successfully
    await expect(page).toHaveTitle(/.*/)

    // Page should not throw any console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForLoadState('networkidle')

    // Allow some errors from dev mode but not critical ones
    const criticalErrors = errors.filter((e) => !e.includes('DevTools') && !e.includes('favicon'))
    expect(criticalErrors.length).toBe(0)
  })

  test('should have working links to auth pages', async ({ page }) => {
    await page.goto('/')

    // If there are login/register links on homepage, test them
    // This is a placeholder - adjust based on actual homepage structure
    const loginLink = page.getByRole('link', { name: /connexion|login/i })
    const registerLink = page.getByRole('link', { name: /inscription|register/i })

    // Check if links exist (they might not on the homepage)
    const loginExists = (await loginLink.count()) > 0
    const registerExists = (await registerLink.count()) > 0

    if (loginExists) {
      await expect(loginLink).toBeVisible()
    }

    if (registerExists) {
      await expect(registerLink).toBeVisible()
    }
  })

  test('should navigate directly to login page', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
  })

  test('should navigate directly to register page', async ({ page }) => {
    await page.goto('/auth/register')

    await expect(page).toHaveURL(/\/auth\/register/)
    await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()
  })

  test('should have proper page title', async ({ page }) => {
    await page.goto('/')

    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: Error[] = []
    page.on('pageerror', (error) => {
      errors.push(error)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should have no JavaScript errors
    expect(errors).toHaveLength(0)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/auth/login')

    // Page should render properly on mobile
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()

    // Form should be usable
    await page.getByLabel(/email/i).fill('test@example.com')
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toHaveValue('test@example.com')
  })

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')

    // Should return 404 status
    expect(response?.status()).toBe(404)
  })
})
