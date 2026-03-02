import { test as base, expect, type Page } from '@playwright/test';

/**
 * Fixtures for common test utilities
 */

// Define custom fixtures
type MyFixtures = {
  authenticatedPage: Page;
  mockUser: {
    email: string;
    id: string;
  };
};


// Helper to mock authenticated session
export async function mockAuthSession(page: Page, userId: string = 'test-user-id', email: string = 'test@example.com') {
  // Mock Supabase auth endpoints
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: userId,
            email: email,
            user_metadata: {},
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock Supabase REST API for user profile queries
  await page.route('**/rest/v1/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: userId,
          email: email,
          full_name: 'Test User',
          image_url: null,
          phone: null,
          user_roles: [{ role: 'tenant' }],
        },
      ]),
    });
  });
}

// Extend base test with fixtures
export const test = base.extend<MyFixtures>({
  mockUser: async ({}, use) => {
    const user = {
      email: 'test@example.com',
      id: 'test-user-id-123',
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(user);
  },

  authenticatedPage: async ({ page, mockUser }, use) => {
    // Mock authentication before using the page
    await mockAuthSession(page, mockUser.id, mockUser.email);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect };

