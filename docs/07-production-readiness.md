# Production Readiness Checklist — reKro

> Audit date: March 2026 · Status: **Not production-ready** — critical gaps identified.
> Target: address all P0 and P1 items before public launch.

---

## Readiness Score

| Category | Score | Status |
|---|---|---|
| Security | 5 / 10 | 🔴 Needs work |
| Performance | 7 / 10 | 🟡 Good, improvable |
| Reliability | 5 / 10 | 🔴 Needs work |
| Observability | 6 / 10 | 🟡 Partial |
| Testing | 3 / 10 | 🔴 Needs work |
| Database | 6 / 10 | 🟡 Partial |
| DevOps / CI | 4 / 10 | 🔴 Needs work |
| Accessibility | 6 / 10 | 🟡 Partial |
| **Overall** | **52 / 100** | 🔴 Pre-launch gaps |

---

## P0 — Blockers (must fix before any public traffic)

### P0-1: Confirm Row Level Security is enabled on all tables

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

**Why:** No CSP means XSS attacks can execute arbitrary scripts in users' browsers.

**How:** See `02-security.md §2.1`.
Start with `Content-Security-Policy-Report-Only` to audit without breaking the app first.

---

### P0-4: Move Sentry DSN to environment variable

**Why:** DSN is hardcoded in committed source (`sentry.server.config.ts`).

```ts
// sentry.server.config.ts
dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
```

---

### P0-5: Reduce Sentry tracesSampleRate in production

**Why:** 100% tracing adds request latency and significant Sentry costs at scale.

```ts
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
```

---

## P1 — High Priority (fix before marketing launch)

### P1-1: Add type-safe environment variable validation

**Why:** Non-null assertions (`!`) on `process.env` cause cryptic runtime failures when
a variable is missing in a new deployment environment.

**How:** See `04-libraries.md §2.2` — `@t3-oss/env-nextjs`.

---

### P1-2: Remove `force-dynamic` from home page

**Why:** Disables all CDN caching for the most-visited page — every visitor hits origin.

**How:** See `01-performance.md §2.2`.

---

### P1-3: Convert authenticated layout to Server Component

**Why:** Client-side redirect in `useEffect` causes a flash of blank content and is not a
true server-enforced route guard.

**How:** See `01-performance.md §2.1`.

---

### P1-4: Add CI pipeline

**Why:** Without CI, broken TypeScript, lint errors, or build failures can reach production.

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm audit --audit-level=high
      - run: npm run build
```

---

### P1-5: Add robots.txt and sitemap.xml

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

