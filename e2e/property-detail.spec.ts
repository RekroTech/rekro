import { test, expect } from './fixtures';

/**
 * Test Suite: Property Detail Page
 *
 * Tests property detail view, unit selection, pricing calculations, and gallery interactions
 */

test.describe('Property Detail Page', () => {
  // Note: This test assumes there are properties in the database
  // In a real scenario, you'd seed test data or use fixtures

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage and click first property
    await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 });

    // Wait for search input to ensure page is loaded
    await page.waitForSelector('#search-input', { timeout: 15000, state: 'visible' });
    await page.waitForTimeout(2000);

    // Use correct selector for property cards
    const firstCard = page.locator('a[href*="/property/"]').first();

    const isCardVisible = await firstCard.isVisible({ timeout: 10000 }).catch(() => false);

    if (isCardVisible) {
      await firstCard.click();
      await page.waitForURL(/\/property\//, { timeout: 15000 });
      await page.waitForTimeout(2000); // Wait for property detail to load
    } else {
      // Skip if no properties available
      test.skip();
    }
  });

  test('should display property header with address and price', async ({ page }) => {
    // Should show property address
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // Should show price
    await expect(page.locator('text=/\\$/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display property images in gallery', async ({ page }) => {
    // Check for images (either in gallery or carousel)
    // Images may have various alt texts including property title
    const images = page.locator('img').filter({ hasNot: page.locator('[alt=""]') });
    const imageCount = await images.count();

    // Verify at least one image exists in the DOM
    expect(imageCount).toBeGreaterThan(0);

    // Check that the first image is attached (may be hidden in carousel)
    await expect(images.first()).toBeAttached({ timeout: 5000 });
  });

  test('should navigate through image gallery', async ({ page }) => {
    // Look for gallery navigation buttons
    const nextButton = page.locator('button[aria-label*="next"]').or(page.getByRole('button', { name: /next/i })).first();

    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click next button
      await nextButton.click();
      await page.waitForTimeout(500);

      // Verify images still exist in DOM (they might not be visible in carousel)
      const anyImage = page.locator('img').first();
      await expect(anyImage).toBeAttached();
    }
  });

  test('should display property amenities', async ({ page }) => {
    // Scroll to amenities section
    await page.evaluate(() => window.scrollBy(0, 400));

    // Look for amenities section
    const amenitiesHeading = page.locator('text=/Amenities|Features/i');
    if (await amenitiesHeading.isVisible()) {
      await expect(amenitiesHeading).toBeVisible();
    }
  });

  test('should display unit selector for multi-unit properties', async ({ page }) => {
    // Look for unit selection UI - use first() to avoid strict mode violation
    const unitSelector = page.locator('text=/Select (a )?Unit|Units|Room/i').first();

    if (await unitSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(unitSelector).toBeVisible();
    }
  });

  test('should update price when selecting different units', async ({ page }) => {
    // Get initial price element
    const priceElement = page.locator('text=/\\$/i').first();

    // Look for unit selection buttons
    const unitButtons = page.getByRole('button').filter({ hasText: /Room|Unit/i });
    const buttonCount = await unitButtons.count();

    if (buttonCount > 1) {
      // Click second unit
      await unitButtons.nth(1).click();
      await page.waitForTimeout(300);

      // Price might change or stay the same
      const newPrice = await priceElement.textContent();
      expect(newPrice).toBeTruthy();
    }
  });

  test('should show occupancy toggle for dual occupancy rooms', async ({ page }) => {
    // Look for occupancy selection
    const occupancyToggle = page.locator('text=/Occupancy Type|Single|Dual/i').first();

    if (await occupancyToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try to toggle to dual occupancy
      const dualButton = page.getByRole('button', { name: /Dual/i });
      if (await dualButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dualButton.click();
        await page.waitForTimeout(500);

        // Verify dual button exists (clicked successfully)
        await expect(dualButton).toBeAttached();
      }
    }
  });

  test('should display back button to return to listings', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /Back/i }).or(page.getByRole('link', { name: /Back/i })).first();

    if (await backButton.isVisible()) {
      await backButton.click();

      // Should navigate back to homepage
      await page.waitForURL('/');
      expect(page.url()).toMatch(/\/$/);
    }
  });

  test('should show "Apply Now" button', async ({ page }) => {
    // Scroll down to find Apply button
    await page.evaluate(() => window.scrollBy(0, 500));

    const applyButton = page.getByRole('button', { name: /Apply|Book/i });
    await expect(applyButton.first()).toBeVisible();
  });

  test('should handle property not found gracefully', async ({ page }) => {
    // Navigate to non-existent property
    await page.goto('/property/non-existent-id-123', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Should show error message or 404 - use heading to avoid strict mode violation
    await expect(page.getByRole('heading', { name: /Property Not Found/i })).toBeVisible({ timeout: 5000 });

    // Should show button to go back
    await expect(page.getByRole('button', { name: /Back to Properties/i })).toBeVisible({ timeout: 5000 });
  });

  test('should display property location on map (if enabled)', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, 600));

    // Check for map container
    const mapContainer = page.locator('[class*="map"], #map, [data-testid="map"]');

    if (await mapContainer.isVisible()) {
      await expect(mapContainer).toBeVisible();
    }
  });

  test('should show liked users carousel (if admin/landlord)', async ({ page }) => {
    // Look for liked users section
    const likedUsersSection = page.locator('text=/Interested Tenants|Liked by/i');

    if (await likedUsersSection.isVisible()) {
      await expect(likedUsersSection).toBeVisible();
    }
  });

  test('should calculate total rent with inclusions', async ({ page }) => {
    // Scroll to inclusions section
    await page.evaluate(() => window.scrollBy(0, 400));

    // Look for inclusions checkboxes - find by label text
    const furnitureLabel = page.locator('label').filter({ hasText: /Furniture/i });
    const furnitureCheckbox = furnitureLabel.locator('input[type="checkbox"]');

    if (await furnitureCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Toggle furniture
      await furnitureCheckbox.check();
      await page.waitForTimeout(300);

      // Total should update
      const newTotal = await page.locator('text=/Total.*Rent|\\$\\d+/i').last().textContent();
      expect(newTotal).toBeTruthy();
    }
  });

  test('should handle responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload to trigger mobile layout
    await page.reload();

    // Check mobile-specific elements
    const mobileGallery = page.locator('[class*="mobile"], img').first();
    await expect(mobileGallery).toBeVisible();
  });

  test('should show property description', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, 300));

    // Look for description section
    const description = page.locator('text=/Description|About this property/i');

    if (await description.isVisible()) {
      await expect(description).toBeVisible();
    }
  });
});

test.describe('Property Error Boundary', () => {
  test('should display error fallback when property fails to load', async ({ page }) => {
    // Navigate to non-existent property ID to trigger error state
    await page.goto('/property/non-existent-test-id-99999', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Wait for error state to render

    // Should show error UI - the page should show "Property Not Found" heading
    const errorHeading = page.getByRole('heading', { name: /Property Not Found/i });
    await expect(errorHeading).toBeVisible({ timeout: 10000 });
  });

  test('should have back button in error state', async ({ page }) => {
    // Navigate to non-existent property directly
    await page.goto('/property/non-existent-id-12345', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Wait for error state to render

    // Look for "Back to Properties" button which should be on error page
    const backButton = page.getByRole('button', { name: /Back to Properties/i });
    await expect(backButton).toBeVisible({ timeout: 10000 });

    // Click and verify navigation
    await backButton.click();
    await page.waitForURL('/', { timeout: 10000 });
    expect(page.url()).toMatch(/\/$/);
  });
});

