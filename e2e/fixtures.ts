import { test as base, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Fixtures = {
  mockUser: { id: string; email: string };
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const SUPABASE_STORAGE_KEY = 'sb-yvetwtcbkgtzufpzmvjr-auth-token';

/** Inject a structurally-valid (but fake) Supabase session cookie. */
export async function injectSession(page: Page, userId: string, email: string) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = btoa(JSON.stringify({
    sub: userId, email, aud: 'authenticated', role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const session = {
    access_token: `${header}.${payload}.fakesig`,
    refresh_token: 'fake-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: userId, email,
      aud: 'authenticated', role: 'authenticated',
      user_metadata: { full_name: 'Test User' },
      app_metadata: {},
      created_at: new Date().toISOString(),
    },
  };

  const cookieValue = `base64-${Buffer.from(JSON.stringify(session))
    .toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;

  await page.context().addCookies([{
    name: SUPABASE_STORAGE_KEY,
    value: cookieValue,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);
}

/** Mock all Supabase auth + profile REST routes for an authenticated user. */
export async function mockAuthRoutes(page: Page, userId: string, email: string) {
  const userRow = {
    id: userId, email,
    full_name: 'Test User',
    image_url: 'https://example.com/avatar.png',
    phone: '+61400000000',
    username: 'testuser',
    date_of_birth: '1995-01-01',
    gender: 'male',
    occupation: 'Engineer',
    bio: 'Test bio',
    native_language: 'English',
    preferred_contact_method: 'email',
    discoverable: true,
    share_contact: true,
    receive_marketing_email: false,
    notification_preferences: {
      emailNotifications: true, smsNotifications: false,
      propertyUpdates: true, applicationUpdates: true,
      messageNotifications: true, marketingEmails: false,
    },
    user_roles: [{ role: 'tenant' }],
    user_application_profile: {
      id: 'mock-profile-id', user_id: userId,
      visa_status: null, employment_status: 'working',
      employment_type: 'full_time', income_source: 'salary',
      income_frequency: 'weekly', income_amount: 1200,
      student_status: 'not_student', finance_support_type: null,
      finance_support_details: null, max_budget_per_week: 800,
      preferred_locality: 'Melbourne', documents: {},
    },
  };

  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'refreshed-fake-token',
        refresh_token: 'fake-refresh',
        expires_in: 3600, token_type: 'bearer',
        user: userRow,
      }),
    });
  });

  await page.route('**/auth/v1/user**', async (route) => {
    if (route.request().method().toUpperCase() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(userRow) });
    } else {
      await route.continue();
    }
  });

  await page.route('**/auth/v1/**', async (route) => route.continue());

  await page.route('**/rest/v1/users**', async (route) => {
    const isSingle = (route.request().headers()['accept'] ?? '').includes('application/vnd.pgrst.object+json');
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(isSingle ? userRow : [userRow]),
    });
  });
}

// ---------------------------------------------------------------------------
// Seeded mock data
// ---------------------------------------------------------------------------

export const MOCK_PROPERTY_ID = 'mock-property-id-001';
export const MOCK_UNIT_ID     = 'mock-unit-id-001';

const mockUnit = {
  id: MOCK_UNIT_ID,
  property_id: MOCK_PROPERTY_ID,
  listing_type: 'room',
  name: 'Room A',
  description: 'A cosy private room.',
  price: 350,
  bond_amount: 700,
  bills_included: false,
  min_lease: 3,
  max_lease: 12,
  max_occupants: 1,
  size_sqm: 14,
  status: 'active',
  available_from: '2026-03-01',
  available_to: null,
};

const mockProperty = {
  id: MOCK_PROPERTY_ID,
  title: 'Test Sharehaus Melbourne',
  description: 'A well-located share house in Fitzroy.',
  property_type: 'house',
  bedrooms: 3,
  bathrooms: 1,
  car_spaces: 1,
  furnished: true,
  is_published: true,
  images: [],
  video_url: null,
  address: {
    street: '1 Test St',
    suburb: 'Fitzroy',
    city: 'Melbourne',
    state: 'VIC',
    postcode: '3065',
    country: 'Australia',
  },
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  units: [mockUnit],
};

/**
 * Mock Supabase REST calls for the property list AND a single property detail.
 * Call this before page.goto() in any test that needs property cards to render.
 */
export async function mockProperties(page: Page) {
  // Both list and single-object requests come through the same REST path
  await page.route('**/rest/v1/properties**', async (route) => {
    const accept = route.request().headers()['accept'] ?? '';
    // .single() uses PostgREST object accept header
    if (accept.includes('application/vnd.pgrst.object+json')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProperty),
      });
      return;
    }
    // List request
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '0-0/1' },
      body: JSON.stringify([mockProperty]),
    });
  });

  // Stub unit_likes so getBulkUnitLikes doesn't throw
  await page.route('**/rest/v1/unit_likes**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

// ---------------------------------------------------------------------------
// Extended test fixture
// ---------------------------------------------------------------------------

export const test = base.extend<Fixtures>({
  mockUser: async ({}, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({ id: 'test-user-id-123', email: 'test@example.com' });
  },
});

export { expect };

