import { expect, test } from '@playwright/test';

test.describe('Core Features E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete user journey through core features', async ({ page }) => {
    // 1. User Authentication
    await test.step('user registration and login', async () => {
      await page.click('text=Register');
      await page.fill('[name=username]', 'testuser');
      await page.fill('[name=email]', 'test@example.com');
      await page.fill('[name=password]', 'password123');
      await page.click('button:text("Register")');

      await expect(page).toHaveURL('/login');
      await page.fill('[name=email]', 'test@example.com');
      await page.fill('[name=password]', 'password123');
      await page.click('button:text("Login")');

      await expect(page).toHaveURL('/dashboard');
    });

    // 2. Universe Management
    await test.step('universe creation and management', async () => {
      await page.click('text=Create Universe');
      await page.fill('[name=name]', 'Test Universe');
      await page.fill('[name=description]', 'A test universe description');
      await page.click('button:text("Create Universe")');

      await expect(page.locator('text=Test Universe')).toBeVisible();

      // Edit universe
      await page.click('button[aria-label="edit"]');
      await page.fill('[name=name]', 'Updated Universe');
      await page.click('button:text("Save")');

      await expect(page.locator('text=Updated Universe')).toBeVisible();
    });

    // 3. Parameter Management
    await test.step('parameter configuration', async () => {
      await page.click('text=Updated Universe');
      await page.click('text=Physics');
      await page.locator('input[type="range"]').first().fill('50');
      await page.click('button:text("Save Parameters")');

      await expect(page.locator('text=Parameters saved')).toBeVisible();
    });

    // 4. Privacy Controls
    await test.step('privacy settings management', async () => {
      await page.click('text=Privacy Settings');
      await page.click('text=Private');
      await page.click('text=Save Changes');

      await expect(page.locator('text=Private')).toBeVisible();
    });

    // 5. Favorites System
    await test.step('favorites management', async () => {
      await page.click('button[aria-label="favorite"]');
      await page.click('text=Favorites');

      await expect(page.locator('text=Updated Universe')).toBeVisible();
    });

    // 6. Collaboration
    await test.step('collaboration features', async () => {
      await page.click('text=Share');
      await page.fill('[placeholder="Type to search users..."]', 'another');
      await page.click('button:text("Add")');

      await expect(page.locator('text=Collaborator added')).toBeVisible();
    });

    // 7. Profile Management
    await test.step('profile customization', async () => {
      await page.click('text=Profile');
      await page.click('text=Edit Profile');
      await page.fill('[name=bio]', 'Test bio');
      await page.click('button:text("Save Changes")');

      await expect(page.locator('text=Profile updated')).toBeVisible();
    });
  });
});
