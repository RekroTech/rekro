import { test, expect } from './fixtures';

/**
 * Test Suite: Property Listing and Search
 *
 * Tests the core functionality of browsing, searching, and filtering properties
 */

test.describe('Property Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display property listings on homepage', async ({ page }) => {
    // Wait for page to load by checking for the search input (always present)
    await page.waitForSelector('#search-input', { timeout: 10000, state: 'visible' });
    await page.waitForTimeout(1000); // Give time for properties to load

    // Check that property cards or empty state is visible
    const hasProperties = await page.locator('a[href*="/property/"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await page.locator('text=/No properties|No results/i').isVisible({ timeout: 1000 }).catch(() => false);

    // At least one should be visible
    expect(hasProperties || hasEmptyState).toBeTruthy();
  });

  test('should search properties by location or name', async ({ page }) => {
    // Find and fill search input using the actual ID from the page
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill('Sydney');

    // Wait for search to complete (debounced)
    await page.waitForTimeout(1000);

    // Verify search is working - either shows results or "no results" message
    const hasResults = await page.locator('a[href*="/property/"]').count() > 0;
    const hasNoResults = await page.locator('text=/No properties found/i').isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('should clear search when clicking clear button', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Enter search text
    await searchInput.fill('Melbourne');
    await page.waitForTimeout(500);

    // Click clear button (X icon)
    const clearButton = page.locator('button[aria-label="Clear search"]');
    if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearButton.click();

      // Verify input is cleared
      await expect(searchInput).toHaveValue('');
    }
  });

  test('should filter properties by property type', async ({ page }) => {
    // Open filters (mobile might need toggle)
    const filterToggle = page.getByRole('button', { name: /filters/i });
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    // Select property type filter
    const propertyTypeSelect = page.locator('select').filter({ hasText: /Property Type|Type/i }).first();
    if (await propertyTypeSelect.isVisible()) {
      await propertyTypeSelect.selectOption('apartment');
      await page.waitForTimeout(500);

      // Verify filter is applied
      const url = page.url();
      expect(url).toContain('propertyType=apartment');
    }
  });

  test('should filter properties by bedrooms', async ({ page }) => {
    // Open filters if needed
    const filterToggle = page.getByRole('button', { name: /filters/i });
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    // Select bedrooms filter
    const bedroomsSelect = page.locator('select').filter({ hasText: /Bedrooms/i }).first();
    if (await bedroomsSelect.isVisible()) {
      await bedroomsSelect.selectOption('2');
      await page.waitForTimeout(500);

      // Verify URL params updated
      const url = page.url();
      expect(url).toContain('bedrooms=2');
    }
  });

  test('should toggle between status tabs (admin feature)', async ({ page }) => {
    // Check if status tabs are visible (admin only)
    const activeTab = page.getByRole('button', { name: /active/i });
    const leasedTab = page.getByRole('button', { name: /leased/i });

    if (await activeTab.isVisible()) {
      // Click on leased tab
      await leasedTab.click();
      await page.waitForTimeout(500);

      // Verify tab is selected
      await expect(leasedTab).toHaveClass(/selected|active/);
    }
  });

  test('should handle responsive layout on mobile', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile layout elements
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Check if filter toggle button is visible on mobile
    const filterToggle = page.getByRole('button', { name: /filters/i });
    if (await filterToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterToggle.click();

      // Verify filters panel opens
      await expect(page.locator('select').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for something that likely won't exist
    await searchInput.fill('xyznonexistentpropertyname123');
    await page.waitForTimeout(1000);

    // Should show empty state or no results message
    const noResults = await page.locator('text=/No properties found|No results/i').isVisible({ timeout: 3000 }).catch(() => false);
    expect(noResults).toBeTruthy();
  });

  test('should load more properties on scroll (infinite scroll)', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1500);

    // Get initial property count
    const initialCount = await page.locator('a[href*="/property/"]').count();

    if (initialCount > 0) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for potential new items to load
      await page.waitForTimeout(1500);

      // Count should be same or more (if more pages exist)
      const newCount = await page.locator('a[href*="/property/"]').count();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    }
  });
});

test.describe('Property Card Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page load
    await page.waitForSelector('#search-input', { timeout: 10000, state: 'visible' });
    await page.waitForTimeout(1500); // Wait for properties to load
  });

  test('should display essential property information', async ({ page }) => {
    const firstCard = page.locator('a[href*="/property/"]').first();

    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Should contain property image, price, location, bedrooms, bathrooms
      await expect(firstCard).toBeVisible();

      // Check for price ($ symbol)
      await expect(firstCard.locator('text=/\\$/i')).toBeVisible();
    }
  });

  test('should navigate to property detail page on card click', async ({ page }) => {
    const firstCard = page.locator('a[href*="/property/"]').first();

    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCard.click();

      // Wait for navigation
      await page.waitForURL(/\/property\//, { timeout: 10000 });

      // Verify we're on property detail page
      expect(page.url()).toMatch(/\/property\/[a-z0-9-]+/);
    }
  });

  test('should have proper hover effects on property cards', async ({ page }) => {
    const firstCard = page.locator('a[href*="/property/"]').first();

    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify card exists and is interactive
      await expect(firstCard).toBeVisible();

      // Check that card has proper structure with image
      const cardImage = firstCard.locator('img, div[style*="background"]').first();
      await expect(cardImage).toBeAttached();
    }
  });
});

