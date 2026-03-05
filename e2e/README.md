# E2E Smoke Tests

Five critical-path smoke tests for the Rekro MVP. They run fast, avoid pixel-perfect assertions, and stop at the boundaries that matter.

## Tests (`smoke.spec.ts`)

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | **Homepage loads + listings render** | Shell renders, search input is present, property cards or empty-state appears |
| 2 | **Auth flow – magic-link form** | Sign-in modal opens, email input accepts input, OTP endpoint called, success message shown |
| 3 | **Search → open listing** | Search filter runs without error, clicking a card navigates to `/property/<id>` |
| 4 | **Enquiry form (unauthenticated)** | Guest clicking the booking CTA is shown a login prompt (modal or redirect) |
| 5 | **Protected route (authenticated)** | Mocked-in user can reach `/applications` without being bounced to an error page |

## Running

```bash
# Run smoke tests only
npx playwright test e2e/smoke.spec.ts

# With UI (headed)
npx playwright test e2e/smoke.spec.ts --headed

# Single test by title
npx playwright test e2e/smoke.spec.ts -g "homepage"
```

## Supporting files

| File | Purpose |
|------|---------|
| `fixtures.ts` | `injectSession` + `mockAuthRoutes` helpers, extended `test` object |
| `smoke.spec.ts` | The 5 smoke tests |

## Design decisions

- **No pixel-perfect or screenshot tests** – CI environments differ too much.
- **`test.skip()` over hard failures** – if a feature hasn't shipped yet the test skips rather than fails.
- **Route mocking for auth** – avoids any dependency on real Supabase credentials in CI.
- **Short timeouts with early-exit** – no `waitForTimeout` > 1.5 s.

