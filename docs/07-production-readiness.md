# Production Readiness Checklist - reKro

> Audit date: March 28, 2026 (repository audit)
> Status: **Not production-ready** - 2 P0 blockers remain
> Scope: code and SQL files currently committed to this repo (not Supabase dashboard runtime state)

## Executive snapshot

- **Overall readiness: 67/100**
- **P0 blockers:**
  - `P0-1` RLS coverage is incomplete in version-controlled SQL
  - `P0-2` No effective distributed rate limiting on public mutation endpoints
- **Major improvements since previous audit:**
  - CSP header now exists in `next.config.ts`
  - Sentry DSN uses env var and production trace sampling is reduced to `0.1`
  - `@t3-oss/env-nextjs` is installed and `src/env.ts` exists
  - `robots.ts` and `sitemap.ts` now exist
  - Home page no longer exports `force-dynamic`
  - Authenticated layout is server-guarded via `redirect()`
  - Vercel Analytics + Speed Insights are integrated in `src/app/layout.tsx`

---

## Readiness score

| Category | Score | Status | Evidence |
|---|---:|---|---|
| Security | 6/10 | Partial | CSRF precheck + CSP present, but RLS/rate limiting gaps remain |
| Performance | 7/10 | Good | Homepage no longer forced dynamic; analytics/speed insights enabled |
| Reliability | 6/10 | Partial | Good guards, but error payload leakage and no load testing evidence |
| Observability | 8/10 | Good | Sentry configured with env DSN and reduced prod tracing |
| Testing | 3/10 | Weak | E2E only; no unit test suite detected |
| Database | 4/10 | Weak | Most table SQL files do not include RLS enable/policies |
| DevOps/CI | 6/10 | Partial | Build/test scripts present; pipeline state not fully verifiable from repo alone |
| Accessibility | 6/10 | Partial | No dedicated accessibility audit artifacts in repo |
| **Overall** | **67/100** | **Not ready** | Resolve P0 items before public launch |

---

## Control-by-control status

### P0-1: Row Level Security documented and complete

**Status:** ❌ **BLOCKER - NOT COMPLETE IN REPO**

**Evidence from repo:**
- `database/policies/` is empty
- Only limited policy coverage found in committed SQL:
  - `database/tables/enquiries.sql` includes `enable row level security` and one insert policy
  - `database/tables/application_snapshot.sql` includes one insert policy, but no explicit `enable row level security`
- Most table files under `database/tables/` have no committed RLS statements or policies

**Risk:** If dashboard policies diverge from repo, environment drift can expose data or break access in future deployments.

**Required fix before launch:**
1. Export and commit canonical RLS for all public tables.
2. Add explicit `alter table ... enable row level security;` + least-privilege policies.
3. Add a verification SQL script (or migration) and run it in staging and production.

---

### P0-2: Rate limiting on abuse-prone endpoints

**Status:** ❌ **BLOCKER - NOT EFFECTIVE**

**Evidence from repo:**
- `@upstash/ratelimit` and `@upstash/redis` are installed (`package.json`)
- In-memory helper exists in `src/app/api/utils.ts` as `checkRateLimit()`
- No route calls `checkRateLimit()`; no Upstash-based limiter is wired into:
  - `src/app/api/auth/otp/route.ts`
  - `src/app/api/enquiries/route.ts`
  - `src/app/api/property/route.ts`

**Risk:** Unlimited OTP and enquiry submissions can cause spam, cost abuse, and degraded deliverability.

**Required fix before launch:**
1. Implement distributed rate limiting (Upstash Redis) on OTP and enquiry endpoints.
2. Return `429` with clear retry guidance.
3. Add tests for limit enforcement and reset windows.

---

### P0-3: Content Security Policy

**Status:** ✅ **IMPLEMENTED**

**Evidence:** `next.config.ts` sets `Content-Security-Policy` plus HSTS, frame/options, and referrer policy.

**Follow-up hardening (P1):** remove unnecessary `'unsafe-inline'` directives where possible and add reporting endpoint.

---

### P0-4: Sentry DSN in env vars

**Status:** ✅ **IMPLEMENTED**

**Evidence:**
- `sentry.server.config.ts`: `dsn: process.env.NEXT_PUBLIC_SENTRY_DSN`
- `sentry.edge.config.ts`: `dsn: process.env.NEXT_PUBLIC_SENTRY_DSN`
- `src/instrumentation-client.ts`: `dsn: process.env.NEXT_PUBLIC_SENTRY_DSN`

---

### P0-5: Sentry trace sampling in production

**Status:** ✅ **IMPLEMENTED**

**Evidence:** All three Sentry configs use:

```ts
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1
```

---

## P1 - High priority (before marketing launch)

### P1-1: Type-safe env validation

**Status:** ⚠️ **PARTIAL**

**Evidence:**
- `src/env.ts` uses `@t3-oss/env-nextjs`
- However, direct `process.env.*` access still exists in multiple files (for example: `src/lib/email/enquiries.tsx`, `src/hooks/usePlacesAutocomplete.ts`, `src/components/Properties/PropertyMapView.tsx`)

**Action:** migrate app-level env reads to `env` where feasible, keeping framework-required `process.env` usage only where necessary.

---

### P1-2: Remove homepage `force-dynamic`

**Status:** ✅ **IMPLEMENTED**

**Evidence:** `src/app/page.tsx` has no `export const dynamic = "force-dynamic"`.

---

### P1-3: Authenticated layout as Server Component guard

**Status:** ✅ **IMPLEMENTED**

**Evidence:** `src/app/(authenticated)/layout.tsx` is async server component and uses `redirect("/?auth=open")` when unauthenticated.

---

### P1-4: CI pipeline

**Status:** ⚠️ **PARTIAL / NOT FULLY VERIFIABLE FROM REPO**

**Evidence:** repo has scripts for `build`, `lint`, `typecheck`, and Playwright tests in `package.json`.

**Action:** ensure branch protection requires passing checks; if relying on Vercel-only checks, document that policy in `README.md`.

---

### P1-5: `robots.txt` and `sitemap.xml`

**Status:** ✅ **IMPLEMENTED**

**Evidence:**
- `src/app/robots.ts`
- `src/app/sitemap.ts`

---

### P1-6: CSRF origin checks on mutations

**Status:** ✅ **IMPLEMENTED (GOOD BASELINE)**

**Evidence:** `src/app/api/utils.ts` `precheck()` enforces origin/referer checks for mutating methods by default; mutating routes call `precheck(...)`.

---

### P1-7: Sanitize DB errors returned to clients

**Status:** ❌ **NOT COMPLETE**

**Evidence:** several API handlers still return raw DB error messages (examples in `src/app/api/property/route.ts`, `src/app/api/property/[id]/route.ts`, `src/app/api/application/route.ts`).

**Action:** return generic messages to clients and log structured details server-side.

---

### P1-8: Analytics and speed insights

**Status:** ✅ **IMPLEMENTED**

**Evidence:**
- packages in `package.json`: `@vercel/analytics`, `@vercel/speed-insights`
- `src/app/layout.tsx` renders `<Analytics />` and `<SpeedInsights />` in production.

---

### P1-9: Unit tests for critical business logic

**Status:** ❌ **NOT IMPLEMENTED**

**Evidence:** no `*.test.*`/`*.spec.*` files found in `src/`; existing suite is Playwright smoke tests in `e2e/`.

---

## Current top risks (ordered)

1. Missing committed RLS baseline for most tables (`P0-1`)
2. No effective distributed rate limiting on public write endpoints (`P0-2`)
3. Raw DB error details still exposed in some API responses (`P1-7`)
4. Inconsistent env access pattern (`env` + direct `process.env`) (`P1-1`)
5. No unit-test safety net for core business logic (`P1-9`)

---

## 14-day remediation plan

### Week 1 (must-complete)

1. **RLS baseline in git**
   - Commit complete table-by-table RLS SQL to `database/policies/` or canonical migration files.
   - Add explicit enable statements and policy tests.
2. **Upstash rate limiting**
   - Wire Redis-backed limits into OTP, enquiries, and property creation routes.
   - Add response headers (`Retry-After`) and route-specific keys.
3. **Error message sanitization**
   - Replace client-facing DB messages with generic errors.
   - Keep detailed server logs for incident debugging.

### Week 2

1. **Env consistency pass**
   - Migrate high-traffic modules to `env` imports where possible.
2. **Unit test baseline**
   - Add Vitest + initial tests for authorization helpers and core validators.
3. **CSP hardening**
   - Reduce inline allowances and roll out report endpoint.

---

## Verification checklist before launch

- [ ] RLS query output confirms `rowsecurity = true` on all public tables
- [ ] Public mutation routes enforce distributed rate limits and return `429` when exceeded
- [ ] No API route returns raw database engine messages to clients
- [ ] Unit tests run in CI and pass
- [ ] Full E2E smoke suite passes on staging
- [ ] Rollback and incident response notes are documented

---

## Useful references

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase RLS guide: https://supabase.com/docs/guides/auth/row-level-security
- Next.js caching docs: https://nextjs.org/docs/app/building-your-application/caching
- Vercel deployment docs: https://vercel.com/docs/deployments/overview

