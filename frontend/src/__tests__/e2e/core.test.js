import { expect, test } from '@playwright/test';

test.describe('Core Application Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete user journey with error scenarios', async ({ page }) => {
    // Test error handling first
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });
    await page.click('text=Try Demo Account');
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    // Reset route and proceed with successful login
    await page.unroute('**/api/auth/login');
    await page.click('text=Try Demo Account');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();

    // Universe Creation and Management
    await page.click('button[aria-label="add universe"]');
    await expect(page).toHaveURL('/universes/new');
    await page.fill('input[name="name"]', 'Test Universe');
    await page.fill('textarea[name="description"]', 'A test universe description');
    await page.click('text=Enable Physics');
    await page.click('text=Enable Music');
    await page.click('text=Create Universe');
    await expect(page).toHaveURL(/\/universes\/\d+/);

    // Parameter Management and Real-time Features
    await page.click('text=Physics');
    await page.locator('input[type="range"]').first().fill('75');
    await page.click('[data-testid="SaveIcon"]');
    await expect(page.locator('text="Parameters updated successfully"')).toBeVisible();

    // Privacy and Collaboration Features
    await page.click('[data-testid="SettingsIcon"]');
    await expect(page.locator('text=Privacy Settings')).toBeVisible();
    await page.click('text=Private Universe');
    await page.fill('input[placeholder="Add collaborator by email"]', 'test@example.com');
    await page.click('[data-testid="PersonAddIcon"]');
    await page.click('text=Save');

    // Universe Discovery and Interaction
    await page.click('text=Explore');
    await expect(page).toHaveURL('/explore');
    await page.fill('input[placeholder="Search universes..."]', 'Test Universe');
    await expect(page.locator('text=Test Universe')).toBeVisible();
    await page.click('[data-testid="StarBorderIcon"]');
    await expect(page.locator('[data-testid="StarIcon"]')).toBeVisible();

    // Profile Management
    await page.click('text=Profile');
    await expect(page).toHaveURL('/profile');
    await page.click('text=Edit Profile');
    await page.fill('input[placeholder="Display Name"]', 'Test User');
    await page.fill('textarea[placeholder="Tell us about yourself..."]', 'Test bio');
    await page.click('text=Save');

    // Theme and Responsiveness
    await page.click('text=Dark Mode');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 18)');

    // Test responsive layouts
    await page.setViewportSize({ width: 375, height: 667 });
    await page.click('button[aria-label="open drawer"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.MuiGrid-container')).toHaveCSS('grid-template-columns', /repeat\(4, 1fr\)/);

    // Cleanup and Logout
    await page.click('[aria-label="account menu"]');
    await page.click('text=Logout');
    await expect(page).toHaveURL('/');
  });
});
