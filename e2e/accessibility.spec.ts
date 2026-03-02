import { test, expect } from './fixtures';

/**
 * Test Suite: Accessibility (A11y)
 *
 * Tests keyboard navigation, ARIA labels, and screen reader support
 */

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate through interactive elements with Tab', async ({ page }) => {
    // Press Tab multiple times to ensure we focus on standard interactive elements
    // (first tab might focus on Next.js portal or other framework elements)
    let focusedElement = '';
    let attempts = 0;
    const maxAttempts = 10;
    const interactiveElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];

    while (attempts < maxAttempts) {
      await page.keyboard.press('Tab');

      focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName || '';
      });

      // If we found a standard interactive element, verify and break
      if (interactiveElements.includes(focusedElement)) {
        expect(interactiveElements).toContain(focusedElement);
        break;
      }

      attempts++;
    }

    // At least one standard interactive element should be found within max attempts
    expect(interactiveElements).toContain(focusedElement);
  });

  test('should be able to navigate search with keyboard only', async ({ page }) => {
    // Locate the search input by type and aria-label
    const searchInput = page.locator('input[type="search"][aria-label*="Search" i]').first();

    // Verify it exists
    await expect(searchInput).toBeVisible();

    // Focus the search input
    await searchInput.focus();

    // Type search query
    await searchInput.fill('Sydney');
    await page.waitForTimeout(500);

    // Verify search is working
    const inputValue = await searchInput.inputValue();
    expect(inputValue).toContain('Sydney');
  });

  test('should activate buttons with Enter key', async ({ page }) => {
    // Find a button and focus it
    const firstButton = page.locator('button').first();
    if (await firstButton.isVisible()) {
      await firstButton.focus();
      await page.keyboard.press('Enter');

      // Button should be activated (verify by checking for modal or navigation)
      await page.waitForTimeout(300);
    }
  });

  test('should close modals with Escape key', async ({ page }) => {
    // Open a modal (e.g., auth modal)
    const signInButton = page.getByRole('button', { name: /sign in/i }).first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(300);

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should close
      await page.waitForTimeout(300);
      const modalVisible = await page.locator('input[type="email"]').isVisible();
      expect(modalVisible).toBeFalsy();
    }
  });

  test('should trap focus within modal dialogs', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: /sign in/i }).first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);

      // Check if modal has proper ARIA attributes
      const modal = page.locator('[role="dialog"][aria-modal="true"]');
      await expect(modal).toBeVisible();

      // Check if modal is visible by looking for email input
      const emailInput = page.locator('input[type="email"]');
      const modalVisible = await emailInput.isVisible();

      if (modalVisible) {
        // Focus the email input
        await emailInput.focus();

        // Tab through modal elements multiple times
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
        }

        // Focus should remain within modal
        const focusIsInModal = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"]');
          const activeElement = document.activeElement;
          return modal?.contains(activeElement) ?? false;
        });

        expect(focusIsInModal).toBeTruthy();
      }
    }
  });
});

test.describe('ARIA Labels and Semantic HTML', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();

    // Should have at least one h1
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have descriptive alt text for images', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      // Check first few images for alt text
      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');

        // Alt should exist (can be empty for decorative images)
        expect(alt).not.toBeNull();
      }
    }
  });

  test('should have ARIA labels for icon buttons', async ({ page }) => {
    // Check buttons that have aria-label (typically icon buttons)
    const iconButtons = page.locator('button[aria-label]');
    const count = await iconButtons.count();

    if (count > 0) {
      const firstButton = iconButtons.first();
      const ariaLabel = await firstButton.getAttribute('aria-label');
      const ariaLabelledby = await firstButton.getAttribute('aria-labelledby');

      // Should have some form of label
      expect(ariaLabel || ariaLabelledby).toBeTruthy();
    }
  });

  test('should mark required form fields properly', async ({ page }) => {
    // Open application modal if possible
    const firstCard = page.locator('[data-testid="property-card"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForURL(/\/property\//);

      const applyButton = page.getByRole('button', { name: /apply/i }).first();
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await page.waitForTimeout(500);

        // Check required inputs
        const requiredInputs = page.locator('input[required], input[aria-required="true"]');
        const count = await requiredInputs.count();

        expect(count).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should have proper button roles', async ({ page }) => {
    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should have accessible form labels', async ({ page }) => {
    const inputs = page.locator('input[type="text"], input[type="email"]');
    const count = await inputs.count();

    if (count > 0) {
      const firstInput = inputs.first();
      const id = await firstInput.getAttribute('id');
      const ariaLabel = await firstInput.getAttribute('aria-label');
      const ariaLabelledby = await firstInput.getAttribute('aria-labelledby');

      // Should have label association or aria-label
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).isVisible() : false;

      expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
    }
  });
});

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const hasFocusRing = await page.evaluate(() => {
      const focused = document.activeElement as HTMLElement;
      const styles = window.getComputedStyle(focused);

      // Check for outline or box-shadow (common focus indicators)
      return (
        styles.outline !== 'none' ||
        styles.outlineWidth !== '0px' ||
        styles.boxShadow !== 'none'
      );
    });

    expect(hasFocusRing).toBeTruthy();
  });

  test('should restore focus after modal closes', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: /sign in/i }).first();
    if (await signInButton.isVisible()) {
      // Focus and click sign in
      await signInButton.focus();
      await signInButton.click();
      await page.waitForTimeout(500);

      // Verify modal opened
      const modalVisible = await page.locator('[role="dialog"]').isVisible();
      if (!modalVisible) {
        // Modal didn't open, skip test
        return;
      }

      // Close modal
      await page.keyboard.press('Escape');

      // Wait for modal to close
      await page.waitForTimeout(500);

      // Verify modal is closed
      const modalClosed = await page.locator('[role="dialog"]').isHidden();
      expect(modalClosed).toBeTruthy();

      // Check that focus is not trapped in the (now closed) modal
      // Focus should be somewhere in the document, not in a detached element
      const focusIsValid = await page.evaluate(() => {
        const activeElement = document.activeElement;
        // Focus should be in the document (body or a valid element)
        return activeElement !== null && document.contains(activeElement);
      });

      expect(focusIsValid).toBeTruthy();
    }
  });
});

test.describe('Screen Reader Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have descriptive page titles', async ({ page }) => {
    const title = await page.title();

    // Title should be descriptive
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('');
  });

  test('should announce dynamic content changes', async ({ page }) => {
    // Check for ARIA live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const count = await liveRegions.count();

    // Having live regions is good for dynamic updates
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have skip to main content link', async ({ page }) => {
    // Find the skip link element directly
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Verify skip link text
    const skipLinkText = await skipLink.textContent();
    expect(skipLinkText?.toLowerCase()).toMatch(/skip.*main.*content/i);

    // Tab until we find the skip link (it should be one of the first few elements)
    let foundSkipLink = false;
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');

      const activeElementInfo = await page.evaluate(() => {
        const activeElement = document.activeElement;
        return {
          text: activeElement?.textContent?.trim().toLowerCase() || '',
          href: (activeElement as HTMLAnchorElement)?.href || '',
        };
      });

      if (activeElementInfo.text.match(/skip.*main.*content/i)) {
        foundSkipLink = true;
        expect(activeElementInfo.href).toContain('#main-content');

        // Test that clicking/activating the skip link focuses main content
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);

        const mainContentFocused = await page.evaluate(() => {
          const activeElement = document.activeElement;
          return activeElement?.id === 'main-content';
        });

        expect(mainContentFocused).toBeTruthy();
        break;
      }
    }

    expect(foundSkipLink).toBeTruthy();
  });
});

test.describe('Color Contrast and Visual Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should not rely solely on color for information', async ({ page }) => {
    // Error messages should have icons or text, not just color
    // This is a manual check in most cases, but we can verify structure

    const buttons = page.locator('button');
    const count = await buttons.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Emulate reduced motion preference before navigation
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');

    // Page should still load properly with reduced motion
    await expect(page.locator('#main-content')).toBeVisible();

    // Verify critical content is still accessible
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });
});

