import { test, expect } from '@playwright/test';

test.describe('Core Features E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('complete user journey', async ({ page }) => {
    // 1. User Authentication
    await test.step('Register new user', async () => {
      await page.click('text=Register');
      await page.fill('input[name="username"]', 'testuser');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.click('button:text("Register")');
      await expect(page).toHaveURL('/dashboard');
    });

    // 2. Universe Management
    await test.step('Create and manage universe', async () => {
      await page.click('text=Universes');
      await page.click('text=Create Universe');
      await page.fill('input[name="name"]', 'Test Universe');
      await page.fill('textarea[name="description"]', 'A test universe description');
      await page.click('button:text("Create")');
      await expect(page.getByText('Test Universe')).toBeVisible();

      // Edit universe
      await page.click('[data-testid="edit-universe"]');
      await page.fill('input[name="name"]', 'Updated Universe');
      await page.click('button:text("Save")');
      await expect(page.getByText('Updated Universe')).toBeVisible();
    });

    // 3. Parameter Management
    await test.step('Configure universe parameters', async () => {
      await page.click('[data-testid="parameters-tab"]');

      // Physics parameters
      await page.fill('input[name="gravity"]', '9.81');
      await page.fill('input[name="friction"]', '0.5');

      // Music parameters
      await page.fill('input[name="tempo"]', '120');
      await page.selectOption('select[name="key"]', 'C');

      await page.click('button:text("Apply")');
      await expect(page.getByText('Parameters updated')).toBeVisible();
    });

    // 4. Privacy Controls
    await test.step('Configure privacy settings', async () => {
      await page.click('[data-testid="privacy-tab"]');
      await page.click('text=Public Universe');
      await page.click('text=Allow Guests');

      // Add collaborator
      await page.fill('input[name="collaborator"]', 'collaborator@example.com');
      await page.click('button:text("Add Collaborator")');

      await expect(page.getByText('collaborator@example.com')).toBeVisible();
    });

    // 5. Favorites Management
    await test.step('Manage favorites', async () => {
      await page.click('text=Favorites');
      await expect(page.getByText('No favorites yet')).toBeVisible();

      // Add to favorites
      await page.click('text=Universes');
      await page.click('[data-testid="favorite-button"]');

      // Verify favorite added
      await page.click('text=Favorites');
      await expect(page.getByText('Updated Universe')).toBeVisible();
    });

    // 6. Profile Management
    await test.step('Update profile', async () => {
      await page.click('text=Profile');
      await page.click('text=Edit Profile');

      await page.fill('input[name="bio"]', 'Test bio');
      const avatarInput = await page.locator('input[type="file"]');
      await avatarInput.setInputFiles('path/to/test/avatar.jpg');

      await page.click('button:text("Save Changes")');
      await expect(page.getByText('Profile updated')).toBeVisible();
    });

    // 7. Real-time Collaboration
    await test.step('Verify real-time updates', async () => {
      await page.click('text=Universes');
      await page.click('text=Updated Universe');

      // Open WebSocket connection
      await expect(page.getByTestId('connection-status')).toHaveText('Connected');

      // Verify presence indicator
      await expect(page.getByTestId('active-users')).toBeVisible();

      // Verify parameter updates are reflected
      await page.fill('input[name="gravity"]', '10.0');
      await expect(page.getByText('Parameter updated by testuser')).toBeVisible();
    });

    // 8. Cleanup
    await test.step('Delete universe and logout', async () => {
      await page.click('text=Universes');
      await page.click('[data-testid="delete-universe"]');
      await page.click('text=Confirm');
      await expect(page.getByText('Universe deleted')).toBeVisible();

      await page.click('text=Logout');
      await expect(page).toHaveURL('/login');
    });
  });
});
