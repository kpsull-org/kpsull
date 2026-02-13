import { test, expect } from '@playwright/test';

test.describe('Header dropdown hover interactions', () => {
  test('should keep profile dropdown open when moving mouse to it', async ({ page }) => {
    // This test requires an authenticated session.
    test.skip(!process.env.E2E_TEST_USER_EMAIL, 'Requires authenticated session');

    await page.goto('/');

    // Hover the profile button
    const profileButton = page.getByRole('button', { name: /mon compte/i });
    await profileButton.hover();

    // The dropdown should appear
    const profileLink = page.getByRole('link', { name: /mon profil/i });
    await expect(profileLink).toBeVisible({ timeout: 2000 });

    // Move mouse slowly downward into the dropdown
    const buttonBox = await profileButton.boundingBox();
    if (buttonBox) {
      // Move to the center-bottom of the button, then down into the dropdown area
      await page.mouse.move(
        buttonBox.x + buttonBox.width / 2,
        buttonBox.y + buttonBox.height + 10
      );
    }

    // Dropdown should still be visible
    await expect(profileLink).toBeVisible();
  });

  test('should keep cart dropdown open when moving mouse to it', async ({ page }) => {
    // This test requires an authenticated session with items in cart.
    test.skip(!process.env.E2E_TEST_USER_EMAIL, 'Requires authenticated session');

    await page.goto('/');

    const cartButton = page.getByRole('button', { name: /panier/i });
    await cartButton.hover();

    // Give dropdown time to appear
    await page.waitForTimeout(300);

    // Move mouse slowly downward into the dropdown area
    const buttonBox = await cartButton.boundingBox();
    if (buttonBox) {
      await page.mouse.move(
        buttonBox.x + buttonBox.width / 2,
        buttonBox.y + buttonBox.height + 10
      );
    }

    // The dropdown panel should remain visible (not close due to gap)
    const dropdownPanel = page.locator('.group\\/cart .bg-white').first();
    await expect(dropdownPanel).toBeVisible();
  });

  test('should close dropdown when mouse leaves entirely', async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EMAIL, 'Requires authenticated session');

    await page.goto('/');

    const profileButton = page.getByRole('button', { name: /mon compte/i });
    await profileButton.hover();

    const profileLink = page.getByRole('link', { name: /mon profil/i });
    await expect(profileLink).toBeVisible({ timeout: 2000 });

    // Move mouse far away from the dropdown
    await page.mouse.move(0, 0);

    // Dropdown should close
    await expect(profileLink).toBeHidden({ timeout: 2000 });
  });
});
