# Production Readiness Checklist — reKro

> Audit date: March 29, 2026 (repository-backed)
> Scope: repository evidence only — `src/`, `database/`, config files, and package manifest
> Status: **Partially ready** — one clear P0 blocker remains in repo evidence

---

## Executive snapshot

- **Overall readiness: 74 / 100**
- **Remaining P0 blocker:**
  - `P0-1` RLS coverage is not fully evidenced in version-controlled SQL
- **Notable improvements already live:**
  - CSP is configured in `next.config.ts`
  - Sentry DSN is env-backed and production trace sampling is reduced
  - `@t3-oss/env-nextjs` is installed and `src/env.ts` is active
  - Vercel Analytics and Speed Insights are integrated
  - Home page no longer uses `force-dynamic`
  - Authenticated layout is guarded server-side via `getSession()` + `redirect()`
  - App-side rate limiting exists for OTP, enquiries, and property creation

---

## Readiness score

| Category | Score | Status | Evidence |
|---|---:|---|---|
| Security | 7/10 | Good baseline | CSP, CSRF, app-side rate limiting on key public routes, Sentry PII stripping |
| Performance | 8/10 | Good | Home shell not forced dynamic, conditional map loading, analytics/speed insights enabled |
| Reliability | 7/10 | Partial | Better API helpers and auth guards, but uneven structured error handling remains |
| Observability | 8/10 | Good | Sentry + reduced prod tracing + Vercel observability hooks |
| Testing | 3/10 | Weak | Playwright smoke coverage only |
| Database | 5/10 | Partial | Schema/index work exists, but RLS policy baseline is incomplete in git |
| DevOps / CI | 5/10 | Partial | Scripts exist, but no repo-visible CI workflow |
| Accessibility | 6/10 | Partial | Good baseline patterns, but no automated a11y test coverage |
| **Overall** | **74/100** | **Not launch-clean yet** | Resolve RLS baseline and key P1 items |

---

## P0 — Launch blocker

### P0-1: Canonical RLS baseline is incomplete in git

**Status:** ❌ **BLOCKER**

**Why this matters:** the app relies on Supabase and client-accessible data paths. If dashboard policies drift from the repo, access controls can silently regress.

**Evidence from repo:**
- `database/policies/` is empty
- `database/tables/enquiries.sql` includes explicit RLS enablement + policy
- `database/tables/application_snapshot.sql` contains policy content
- many other table files under `database/tables/` do not show committed RLS policy definitions

**Required before launch:**
1. Export and commit canonical RLS policy SQL for all active public tables.
2. Add explicit `ENABLE ROW LEVEL SECURITY` statements where needed.
3. Quarantine deferred/non-MVP tables with deny-by-default policies or remove them.
4. Add a verification script/migration that can be run in staging and production.

---

## P1 — High priority before public growth

### P1-1: Phone verification routes still lack app-side rate limiting

**Status:** ⚠️ **PARTIAL**

**Evidence:**
- `/api/auth/otp`, `/api/enquiries`, and `/api/property` call `checkRateLimit()`.
- `/api/user/phone-verification/send` and `/api/user/phone-verification/verify` do not.

**Action:** add the same limiter pattern to phone verification send/verify flows.

---

### P1-2: Env access is improved but not fully consistent

**Status:** ⚠️ **PARTIAL**

**Evidence:**
- `src/env.ts` uses `@t3-oss/env-nextjs`
- direct `process.env` reads still exist in several app modules and framework-specific files

**Action:** prefer `env` in app-level modules where framework constraints do not require raw `process.env`.

---

### P1-3: CI pipeline is not visible in the repo

**Status:** ⚠️ **NOT FULLY VERIFIABLE**

**Evidence:**
- `package.json` includes `build`, `lint`, `typecheck`, and Playwright scripts
- no `.github/` workflows were found in the workspace snapshot

**Action:** commit CI workflows or document the external CI/deployment policy clearly.

---

### P1-4: Structured/sanitized DB error handling is improved but uneven

**Status:** ⚠️ **PARTIAL**

**Evidence:**
- `dbErrorResponse()` and `logServerError()` exist in `src/app/api/utils.ts`
- many routes use them correctly
- some routes still use plain `errorResponse("Failed ...")` without the richer structured logging helper

**Action:** normalize DB-failure handling across all route handlers.

---

### P1-5: Unit/component/API test coverage is still missing

**Status:** ❌ **NOT IMPLEMENTED**

**Evidence:**
- Playwright smoke tests exist in `e2e/`
- no first-party Vitest / component / route integration test suite is present

**Action:** add unit tests for validators, auth helpers, and critical mutation flows first.

---

## Confirmed completed improvements

### ✅ Authenticated layout is server-guarded

**Evidence:** `src/app/(authenticated)/layout.tsx` uses `getSession()` and `redirect("/?auth=open")`.

---

### ✅ Home page is no longer forced dynamic

**Evidence:** `src/app/page.tsx` does not export `dynamic = "force-dynamic"`.

---

### ✅ CSP is configured

**Evidence:** `next.config.ts` sets `Content-Security-Policy` plus HSTS, frame/options, and referrer policy headers.

---

### ✅ Sentry DSN and production sampling are configured properly

**Evidence:**
- DSN comes from `NEXT_PUBLIC_SENTRY_DSN`
- production sampling uses `process.env.NODE_ENV === "production" ? 0.1 : 1`

---

### ✅ Analytics and real-user monitoring hooks are integrated

**Evidence:** `src/app/layout.tsx` renders `<Analytics />` and `<SpeedInsights />` in production.

---

### ✅ App-side rate limiting exists on the highest-risk public endpoints

**Evidence:**
- `src/app/api/auth/otp/route.ts`
- `src/app/api/enquiries/route.ts`
- `src/app/api/property/route.ts`

all call `checkRateLimit()`.

---

## Current top risks (ordered)

1. Missing committed RLS baseline for most active tables
2. No repo-visible CI / deployment enforcement workflow
3. No unit/component/API integration safety net
4. Inconsistent use of structured DB error logging helpers
5. Phone verification endpoints still rely on provider throttling only

---

## 14-day remediation plan

### Week 1
1. Commit the RLS baseline and verification SQL.
2. Add app-side rate limiting to phone verification routes.
3. Normalize DB error handling to `dbErrorResponse()` / `logServerError()` patterns.

### Week 2
1. Add a minimal Vitest suite for validators + auth helpers.
2. Add/commit CI workflows for `lint`, `typecheck`, and `build`.
3. Add one accessibility smoke test and one abuse/rate-limit regression test.

---

## Verification checklist before launch

- [ ] RLS is committed and verifiably enabled for all active public tables
- [ ] Deferred tables are quarantined or removed
- [ ] Public and phone-verification mutation routes enforce the intended rate limits
- [ ] Critical mutation routes use structured server logging with sanitized client messages
- [ ] Unit tests and Playwright smoke tests pass in CI
- [ ] Rollback / deployment / incident notes are documented
