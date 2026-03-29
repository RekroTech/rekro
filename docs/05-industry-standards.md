# Industry Standards & Best Practices — reKro

> Audit date: March 29, 2026 · Measured against current Next.js 16 / React 19 app-router practices

---

## 1. Code Quality

### 1.1 TypeScript usage ✅ Strong baseline

**What is in place:**
- `tsconfig.json` has `strict: true`
- `ignoreBuildErrors: false` in `next.config.ts`
- generated DB types in `src/types/db.ts`
- Zod validation across key route handlers
- shared `SessionUser` + `AppRole` typing across auth and RBAC flows

**Gaps worth cleaning up:**
- `as unknown as` remains in `src/lib/supabase/server.ts` when extracting `user_roles`
- some route handlers still parse broad `Record<string, unknown>` payloads before narrowing
- a few modules still mix `env` usage with direct `process.env` access

---

### 1.2 Linting & formatting ✅ Good, but not fully hardened

**Confirmed in repo:**
- ESLint 9 with `eslint-config-next`
- `.prettierrc` present

**Missing / not evidenced:**
- no `eslint-plugin-jsx-a11y`
- no `eslint-plugin-security`
- no Husky / lint-staged setup in `package.json`

---

### 1.3 Component architecture ✅ Good

**Current shape:**
- shared primitives in `src/components/common/`
- feature-oriented folders (`Properties`, `Profile`, `Applications`, `Auth`, etc.)
- provider stack consolidated in `src/components/providers/RootProviders.tsx`
- separate hook layers:
  - `src/lib/hooks/` for data / auth / query hooks
  - `src/hooks/` for browser/UI utility hooks

**Good current patterns:**
- `RootProviders` composes `ErrorBoundary`, `NuqsAdapter`, `QueryProvider`, `ToastProvider`, `AuthModalProvider`, `PropertyFormModalProvider`, and `ProfileCompletionProvider`
- heavy UI such as `PropertyForm` is lazy-loaded
- `AuthModal` is lazy-loaded with `React.lazy()`

**Gaps:**
- no Storybook or component-level documentation
- some feature coupling still exists in larger UI components

---

### 1.4 Error handling ✅ Better than average

**Confirmed in repo:**
- root app wrapped with `ErrorBoundary`
- `src/app/global-error.tsx` exists
- `dbErrorResponse()` and `logServerError()` exist for sanitized DB failures with server-side logging
- Sentry is configured on client, server, and edge

**Gaps:**
- not all route handlers consistently use `dbErrorResponse()` / structured logging yet
- no route-segment `error.tsx` coverage was verified beyond the global error boundary

---

## 2. Testing Standards

### Current state

| Layer | Coverage | Tool |
|---|---|---|
| E2E smoke tests | ✅ Present | Playwright |
| Unit tests | ❌ None verified in `src/` | — |
| Component tests | ❌ None verified in `src/` | — |
| API integration tests | ❌ None verified | — |

### Recommended production baseline

| Layer | Target |
|---|---|
| E2E | Critical browse/auth/application flows |
| Unit | Utility functions, validators, authorization helpers |
| Component | Forms, cards, modal states, accessibility behavior |
| API integration | Mutation routes, auth failures, CSRF, rate limits |

### Highest-value missing tests
- property creation route behavior
- application submission / withdrawal / status updates
- phone verification send/verify flows
- CSRF rejection on mutating routes
- rate-limit enforcement on OTP and enquiries
- accessibility smoke tests

---

## 3. Accessibility (A11y)

### Current state ✅ Good baseline

Confirmed from the repo:
- `Skip to main content` link in `src/app/AppShell.tsx`
- `<main id="main-content" role="main" tabIndex={-1}>`
- modal focus handling via `focus-trap-react`
- live-region announcement for property count changes in `PropertyList.tsx`
- screen-reader-only headings and labels are used in key browse flows

### Remaining gaps

| Issue | Priority | Notes |
|---|---|---|
| Toasts lack an explicit `aria-live` container | High | `ToastContext.tsx` renders toasts visually but no explicit live-region wrapper was verified |
| No dedicated accessibility smoke tests | High | Add `@axe-core/playwright` |
| Map interactions need manual keyboard audit | Medium | Especially marker focus and map-only interactions |
| Carousel keyboard behavior should be verified | Medium | Check Embla usage on property image galleries |
| Filter / form control labeling should be spot-checked | Medium | Especially dynamic filter UIs |

---

## 4. API Design Standards

### Current state ✅ Solid foundation

**What is working well:**
- route handlers use App Router conventions correctly
- `precheck()` centralizes CSRF + auth preflight for mutating routes
- `errorResponse()` / `successResponse()` normalize responses
- `dbErrorResponse()` exists for sanitized DB errors
- public, optional-auth, and authenticated routes are clearly separated

**Current gaps:**
- no explicit API versioning strategy
- error payloads are not yet standardized to a richer `{ error: { code, message, details } }` envelope
- no OpenAPI / machine-readable API spec
- no request ID / correlation ID strategy documented

---

## 5. Git & CI/CD Standards

### What the repo shows today
- `package.json` includes `build`, `lint`, `typecheck`, and Playwright scripts
- no `.github/` workflows were found in this workspace snapshot
- Vercel Analytics / Speed Insights are integrated in the app, but deployment policy is not documented in repo

### Recommended baseline

- [ ] Add CI workflows for `lint`, `typecheck`, and `build`
- [ ] Run Playwright smoke tests in CI for preview/staging deploys
- [ ] Protect `main` with required checks
- [ ] Add dependency/security checks (`npm audit` or equivalent)
- [ ] Document deployment promotion / rollback workflow
- [ ] Keep DB migrations and policy changes version-controlled

---

## 6. Documentation Standards

### Current state
- `README.md` exists
- `docs/` now contains audit + standards docs aligned to the repo
- SQL files document schema intentions
- E2E directory has supporting docs

### Still missing
- onboarding guide for new developers
- deployment runbook
- incident response / rollback guide
- architecture decision records (ADRs)
- ER diagram / policy matrix for the database

---

## 7. Observability Standards

### Current state ✅ Good

Confirmed from repo:
- Sentry on client / server / edge
- production trace sampling reduced to `0.1`
- Sentry PII stripping enabled
- `@vercel/analytics` integrated
- `@vercel/speed-insights` integrated

### Gaps

| Missing / partial | Recommendation |
|---|---|
| Alert routing rules | Configure Sentry alert destinations (email/Slack/PagerDuty) |
| Structured application logs | Extend `logServerError()` style logging consistently across routes |
| DB performance observability | Enable/verify `pg_stat_statements` or Supabase query insights |
| Uptime / synthetic monitoring | Add a simple production monitor for critical public pages and auth callbacks |
