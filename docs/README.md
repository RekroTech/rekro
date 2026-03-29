# reKro — Technical Documentation Index

> Generated: March 2026 (repository-aligned refresh) · Stack: Next.js 16 · React 19 · Supabase · TanStack Query v5

This `docs/` folder contains the current technical audit and engineering guidance for the reKro codebase. The files below have been updated against the repository state in `src/`, `database/`, `next.config.ts`, and `package.json`.

---

## Documents

| # | File | Summary | Priority reads |
|---|---|---|---|
| 1 | [Performance](./01-performance.md) | Rendering strategy, bundle size, caching, Core Web Vitals | Home page client shell, Suspense, conditional map loading |
| 2 | [Security](./02-security.md) | CSP, CSRF, rate limiting, RLS posture, Sentry privacy | RLS evidence gap, rate-limit coverage, session refresh scope |
| 3 | [Scalability](./03-scalability.md) | Query patterns, pagination, synchronous email, search, caching | Keyset pagination, FTS, background jobs |
| 4 | [Libraries](./04-libraries.md) | What is already installed, what is still worth adding, what to avoid | Vitest, Inngest, accessibility tooling |
| 5 | [Industry Standards](./05-industry-standards.md) | TypeScript, testing, accessibility, API design, CI/CD | Testing gap, CI visibility, accessibility follow-up |
| 6 | [Suggested Features](./06-suggested-features.md) | Product opportunities ranked by value vs. effort | Inspection scheduling, saved searches, messaging |
| 7 | [Production Readiness](./07-production-readiness.md) | Launch checklist with repo-backed scores and blockers | **Start here before launch** |
| 8 | [Coding Standards](./08-coding-standards.md) | Repo-specific coding conventions and current architecture | Provider stack, `precheck()`, query hooks, env usage |
| 9 | [API Routes Best Practices](./09-api-routes-best-practices.md) | Current route-handler patterns used in this app | `precheck()`, `dbErrorResponse()`, optional auth |
| 10 | [API Routes Refactoring Example](./10-api-routes-refactoring-example.md) | Concrete before/after examples using the app’s real helpers | Refactor toward `precheck()` + sanitized DB errors |

---

## Current Overall Score: 74 / 100 🟡

| Category | Score |
|---|---|
| Security | 7 / 10 |
| Performance | 8 / 10 |
| Reliability | 7 / 10 |
| Observability | 8 / 10 |
| Testing | 3 / 10 |
| Database | 5 / 10 |
| DevOps / CI | 5 / 10 |
| Accessibility | 6 / 10 |

---

## Quick-Start: What to Fix First

### This week (remaining launch blockers / highest risk)
1. Commit canonical RLS policies for all active tables and verify table-by-table coverage → `02-security.md §2.2` / `07-production-readiness.md P0-1`
2. Add app-side rate limiting to phone verification send/verify routes as well, or explicitly accept Supabase-only throttling there → `02-security.md §2.1`
3. Finish sanitizing DB failures in routes that still use raw `errorResponse("Failed ...")` without structured server logging → `07-production-readiness.md P1-4`
4. Document actual CI / deployment policy since no `.github/` workflows are present in the repo → `05-industry-standards.md §5` / `07-production-readiness.md P1-3`

### Next sprint (stability / engineering quality)
5. Add unit and component tests (Vitest + Testing Library) → `04-libraries.md §2.1` / `05-industry-standards.md §2`
6. Run bundle analysis and trim unexpected large chunks → `01-performance.md §4` / `04-libraries.md §2.3`
7. Harden CSP by reducing `'unsafe-inline'` where feasible and consider a report endpoint → `02-security.md §2.4`
8. Reduce direct `process.env` access in app modules that can safely use `env` → `04-libraries.md §2.2` / `07-production-readiness.md P1-1`

### Before scaling
9. Replace offset pagination with keyset pagination for very large listing volumes → `03-scalability.md §3.1`
10. Add PostgreSQL full-text search for listings → `03-scalability.md §3.2`
11. Decouple email sending with a background job runner such as Inngest → `03-scalability.md §3.3`
12. Build inspection scheduling UI on top of the existing `inspection_requests` table → `06-suggested-features.md §1.3`

---

## Stack Reference

```text
Frontend:      Next.js 16.1.5 · React 19.2.3 · TypeScript 5
Styling:       Tailwind CSS v4 · Geist font
State:         TanStack Query v5 (server state) · nuqs (URL state)
Auth:          Supabase Auth (magic link / OTP / phone verification) · @supabase/ssr
Database:      Supabase PostgreSQL · Row Level Security (partially evidenced in repo) · JSONB
Storage:       Supabase Storage (property images, documents)
Email:         Resend · React Email (preview server on :3001)
Maps:          @react-google-maps/api · Google Places Autocomplete
Monitoring:    Sentry · Vercel Analytics · Vercel Speed Insights
Testing:       Playwright smoke tests (no first-party unit/component test suite yet)
Bundler:       Turbopack (Next.js 16 default)
```
