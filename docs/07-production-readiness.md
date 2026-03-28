# Production Readiness Checklist — reKro

> Audit date: March 27, 2026 · Status: **Not production-ready** — critical gaps identified.
> Target: address all P0 and P1 items before public launch.

**Recent audit findings:**
- ❌ No rate limiting on auth/enquiry endpoints (P0-2)
- ⚠️ RLS policies not in version control (P0-1)
- ❌ Sentry DSN hardcoded, 100% trace sampling (P0-4, P0-5)
- ⚠️ Basic security headers exist, but no CSP (P0-3)
- ✅ Vercel CI/CD active (builds, type checks on every push)
- ❌ No env var validation with @t3-oss/env-nextjs (P1-1)
- ❌ Homepage has force-dynamic, no robots.txt/sitemap (P1-2, P1-5)
- ❌ No unit tests, only E2E smoke tests (P1-9)
- **Overall readiness: 50/100** — critical gaps must be addressed before launch

---

## Current Implementation Status

### ✅ What's Working Well
- TanStack Query caching with standardized strategies (`CACHE_STRATEGIES`)
- Comprehensive component library (`@/components/common`) with 20+ reusable components
- Supabase SSR auth with session management
- Playwright E2E smoke tests covering critical flows
- Sentry error monitoring (needs configuration fixes)
- React Email templates for transactional emails
- Role-based access control with `useRoles()` hook and authorization helpers
- Lazy-loaded PropertyForm and AuthModal (~200KB bundle savings)
- **Vercel CI/CD**: Automatic builds and type checks on every push/PR

### ❌ Critical Gaps Before Launch
- **No rate limiting** on auth/enquiry endpoints (P0-2)
- **RLS policies not in version control** (`database/policies/` is empty) (P0-1)
- **Sentry DSN hardcoded** in source files (P0-4)
- **100% trace sampling** in all environments (P0-5)
- **No env var validation** (`@t3-oss/env-nextjs` not installed) (P1-1)
- **force-dynamic on homepage** disables CDN caching (P1-2)
- **No robots.txt/sitemap.xml** (P1-5)
- **No unit tests** for business logic (P1-9)

---

## Readiness Score

| Category | Score | Status | Notes |
|---|---|---|---|
| Security | 4 / 10 | 🔴 Needs work | RLS unknown, no rate limiting, no CSP, Sentry DSN exposed |
| Performance | 6 / 10 | 🟡 Good, improvable | force-dynamic on homepage, no analytics installed |
| Reliability | 5 / 10 | 🔴 Needs work | Error handling in place, needs load testing |
| Observability | 5 / 10 | 🟡 Partial | Sentry configured but 100% tracing |
| Testing | 3 / 10 | 🔴 Needs work | Only E2E smoke tests, no unit tests |
| Database | 5 / 10 | 🟡 Partial | Schema in place, RLS policies unknown, no migrations |
| DevOps / CI | 6 / 10 | 🟡 Good | Vercel CI/CD active, missing robots/sitemap |
| Accessibility | 6 / 10 | 🟡 Partial | Basic aria labels, needs audit |
| **Overall** | **50 / 100** | 🔴 Pre-launch gaps | Critical P0 items must be addressed |

---

## P0 — Blockers (must fix before any public traffic)

### P0-1: Confirm Row Level Security is enabled on all tables

**Status:** ⚠️ UNKNOWN — `database/policies/` directory is empty. RLS policies may be configured directly in Supabase dashboard but are not committed to version control.

**Why:** Without RLS, any user with the Supabase anon key (which is public) can read and
write any row directly via the Supabase JS client.

**How to verify:**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- Every row must show rowsecurity = true
```

Minimum RLS policies needed:

| Table | Read | Write |
|---|---|---|
| `properties` | Published = public; unpublished = owner/admin | Owner or admin |
| `users` | Own row only | Own row only |
| `applications` | Own row or property landlord | Own row |
| `unit_likes` | Own rows | Own rows |
| `user_roles` | Own row | Admin only |
| `enquiries` | Own row or landlord | Insert = anyone |
| `units` | Public if property published | Owner or admin |

Add SQL policy files to `database/policies/` and commit them.

---

### P0-2: Add rate limiting to auth and enquiry endpoints

**Status:** ❌ NOT IMPLEMENTED — `@upstash/ratelimit` and `@upstash/redis` are not installed. No rate limiting exists on any endpoints.

**Why:** `/api/auth/otp` can send unlimited magic-link emails (spam / cost abuse).
`/api/enquiries` can flood landlord inboxes.

**How:** Install `@upstash/ratelimit` + `@upstash/redis` (see `04-libraries.md §1.1`).

Recommended limits:

| Endpoint | Limit |
|---|---|
| `POST /api/auth/otp` | 5 req / 15 min per IP |
| `POST /api/enquiries` | 10 req / hour per IP |
| `POST /api/property` | 20 req / hour per user |

---

### P0-3: Add Content Security Policy header

**Status:** ⚠️ PARTIAL — Basic security headers exist in `next.config.ts` (HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy), but **no CSP header** is configured.

**Why:** No CSP means XSS attacks can execute arbitrary scripts in users' browsers.

**How:** See `02-security.md §2.1`.
Start with `Content-Security-Policy-Report-Only` to audit without breaking the app first.

---

### P0-4: Move Sentry DSN to environment variable

**Status:** ❌ NOT FIXED — DSN is still hardcoded in `sentry.server.config.ts`, `sentry.edge.config.ts`, and `src/instrumentation-client.ts`.

**Why:** DSN is hardcoded in committed source.

```ts
// sentry.server.config.ts
dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
```

---

### P0-5: Reduce Sentry tracesSampleRate in production

**Status:** ❌ NOT FIXED — All three Sentry config files (`sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation-client.ts`) have `tracesSampleRate: 1` (100%).

**Why:** 100% tracing adds request latency and significant Sentry costs at scale.

```ts
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
```

---

## P1 — High Priority (fix before marketing launch)

### P1-1: Add type-safe environment variable validation

**Status:** ❌ NOT IMPLEMENTED — `@t3-oss/env-nextjs` is not installed. Environment variables are accessed directly with `process.env.*` throughout the codebase.

**Why:** Non-null assertions (`!`) on `process.env` cause cryptic runtime failures when
a variable is missing in a new deployment environment.

**How:** See `04-libraries.md §2.2` — `@t3-oss/env-nextjs`.

---

### P1-2: Remove `force-dynamic` from home page

**Status:** ❌ NOT FIXED — Line 21 of `src/app/page.tsx` still has `export const dynamic = "force-dynamic";`. This disables all CDN caching for the most-visited page.

**Why:** Disables all CDN caching for the most-visited page — every visitor hits origin.

**How:** See `01-performance.md §2.2`.

---

### P1-3: Convert authenticated layout to Server Component

**Why:** Client-side redirect in `useEffect` causes a flash of blank content and is not a
true server-enforced route guard.

**How:** See `01-performance.md §2.1`.

---

### P1-4: Add CI pipeline

**Status:** ✅ HANDLED BY VERCEL — Vercel automatically runs build checks on every push and PR. The build process includes:
- TypeScript compilation (`npm run build`)
- ESLint checks (if configured in build command)
- Build failures prevent deployment

**Recommended enhancements:**
- Add pre-commit hooks with Husky to catch issues locally:
  ```bash
  npm install -D husky lint-staged
  npx husky init
  ```
- Configure lint-staged to run type checks and linting on staged files
- Add GitHub Actions for additional checks (e.g., `npm audit`, `npm test`) that don't block deployment but provide visibility

**Optional GitHub Actions for non-blocking checks:**
```yaml
# .github/workflows/checks.yml
name: Additional Checks
on: [push, pull_request]
jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm audit --audit-level=high
  
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
```

---

### P1-5: Add robots.txt and sitemap.xml

**Status:** ❌ NOT IMPLEMENTED — No `robots.ts` or `sitemap.ts` file exists in `src/app/`.

```ts
// src/app/robots.ts
export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/(authenticated)/"] },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
```

---

### P1-6: Add CSRF origin check to mutation API routes

**How:** See `02-security.md §2.6`.

---

### P1-7: Sanitise database error messages returned to clients

**Why:** Raw Supabase error messages may expose table names, column names, or constraint
details to the public internet.

```ts
// Replace in all API routes:
return errorResponse(dbError.message, 500);
// With:
console.error("DB error:", dbError);
return errorResponse("An unexpected error occurred", 500);
```

---

### P1-8: Add analytics and speed insights

**Status:** ❌ NOT INSTALLED — `@vercel/analytics` and `@vercel/speed-insights` are not in package.json and not imported in layout.tsx.

```bash
npm install @vercel/analytics @vercel/speed-insights
```

```tsx
// src/app/layout.tsx — add inside RootLayout
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
// <Analytics /> <SpeedInsights />
```

See `04-libraries.md §3.4`.

---

### P1-9: Write unit tests for critical business logic

**Status:** ❌ NOT IMPLEMENTED — No unit tests exist. Only E2E tests (`e2e/smoke.spec.ts`) with Playwright are present.

| Module | Tests needed |
|---|---|
| `src/lib/utils/authorization.ts` | All role check functions |
| `src/lib/validators/*.ts` | All Zod schemas — valid + invalid inputs |
| `src/lib/utils/dateUtils.ts` | Edge cases |
| `src/lib/utils/geospatial.ts` | Bounding box calculations |

See `04-libraries.md §3.5` for Vitest setup.

---

## P2 — Before Scaling

| Item | Reference |
|---|---|
| Switch pagination to keyset cursor | `03-scalability.md §3.1` |
| Add full-text search index | `03-scalability.md §3.2` |
| Decouple email from request handlers | `03-scalability.md §3.3` |
| Add `aria-live` to toast notifications | Add `role="status"` to `ToastContext.tsx` |
| Lazy-load `jspdf` | `01-performance.md §2.5` |
| Add database migration strategy | Supabase CLI migrations |
| E2E tests for landlord + application flows | Playwright — see gaps in `05-industry-standards.md §2` |

---

## Required Environment Variables (Production)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=https://rekro.com.au

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Email
RESEND_API_KEY=re_...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Rate limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Environment Promotion Checklist

- [ ] Separate Supabase projects for `dev`, `staging`, `production`
- [ ] Separate Sentry environments per deployment target
- [ ] Separate Resend API keys per environment
- [ ] Production env vars stored only in hosting provider — never in git
- [ ] `.env.local` confirmed in `.gitignore` (already present)

---

## Pre-launch Manual Smoke Test

Run before every major deployment:

- [ ] Home page loads and displays property listings
- [ ] Search and filters work (type, bedrooms, listing type, status tabs)
- [ ] Property detail page loads with images and unit details
- [ ] Magic-link OTP sends email and verifies successfully
- [ ] Authenticated user can access `/applications`
- [ ] Guest user can submit an enquiry without signing in
- [ ] Landlord can create a property with image uploads
- [ ] PDF download works on application page
- [ ] Error page renders correctly (visit `/sentry-example-page`)
- [ ] Mobile layout is usable on iOS Safari and Android Chrome
- [ ] Profile page loads and updates correctly
- [ ] Sign out clears session and redirects to home

---

## Recommended Action Plan

### Week 1: Security Blockers (P0)
1. **Day 1-2:** Implement rate limiting with Upstash Redis (P0-2)
   - Install packages: `npm install @upstash/ratelimit @upstash/redis`
   - Add rate limit middleware to auth and enquiry endpoints
   - Test with aggressive automated requests

2. **Day 3:** Audit and document RLS policies (P0-1)
   - Run SQL query to verify rowsecurity is enabled on all tables
   - Export existing policies from Supabase dashboard
   - Commit to `database/policies/` with comments

3. **Day 4:** Security header improvements (P0-3, P0-4, P0-5)
   - Add CSP header to `next.config.ts` (start with report-only mode)
   - Move Sentry DSN to env vars in all three config files
   - Reduce tracesSampleRate to 0.1 in production

### Week 2: DevOps & Performance (P1)
1. **Day 1:** Environment variable validation (P1-1)
   - Install `@t3-oss/env-nextjs`
   - Create `src/env.ts` with all required env vars
   - Replace direct `process.env` access with validated imports

2. **Day 2:** CI/CD enhancements (Optional - P1-4)
   - Vercel handles core CI/CD (builds, type checks)
   - Optionally add GitHub Actions for security audits and tests
   - Consider adding pre-commit hooks with Husky for local validation

3. **Day 3:** SEO & Analytics (P1-5, P1-8)
   - Add `src/app/robots.ts` and `src/app/sitemap.ts`
   - Install and configure Vercel Analytics and Speed Insights
   - Test that sitemap is accessible at `/sitemap.xml`

4. **Day 4-5:** Performance optimization (P1-2, P1-3)
   - Remove `force-dynamic` from homepage, use ISR with revalidation
   - Refactor authenticated layout to use server-side session check
   - Measure impact with Lighthouse/WebPageTest

### Week 3: Testing & Polish
1. **Day 1-2:** Write unit tests (P1-9)
   - Install Vitest
   - Write tests for authorization helpers
   - Write tests for all Zod validators

2. **Day 3:** Error message sanitization (P1-7)
   - Audit all API routes for raw DB error leaks
   - Replace with generic error messages
   - Ensure server logs still capture full errors

3. **Day 4-5:** Final security audit (P1-6, P0-3)
   - Add CSRF origin checks to mutation routes
   - Switch CSP from report-only to enforcing mode
   - Run OWASP ZAP or similar security scanner

### Pre-Launch Final Checks
- [ ] Run full E2E test suite on staging
- [ ] Load test with k6 or Artillery (100-500 concurrent users)
- [ ] Verify all environment variables are set in production hosting
- [ ] Confirm separate Supabase projects for staging and production
- [ ] Set up error alerting (Sentry notifications to Slack/email)
- [ ] Document rollback procedure
- [ ] Schedule launch for low-traffic period (e.g., early morning)

---

## Resources & References

### Security
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CSP Generator: https://report-uri.com/home/generate
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security

### Performance
- Next.js Caching: https://nextjs.org/docs/app/building-your-application/caching
- Web Vitals: https://web.dev/vitals/
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci

### DevOps
- GitHub Actions: https://docs.github.com/en/actions
- Vercel Deployment: https://vercel.com/docs/deployments/overview
- Supabase CLI: https://supabase.com/docs/guides/cli

