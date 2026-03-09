# reKro — Technical Documentation Index

> Generated: March 2026 · Stack: Next.js 16 · React 19 · Supabase · TanStack Query v5

This `docs/` folder contains a full technical audit of the reKro codebase across seven
dimensions. Use this index to navigate to the area most relevant to your current work.

---

## Documents

| # | File | Summary | Priority reads |
|---|---|---|---|
| 1 | [Performance](./01-performance.md) | Bundle size, caching, rendering strategy, Core Web Vitals targets | `force-dynamic` fix, auth layout SSR, jspdf lazy-load |
| 2 | [Security](./02-security.md) | CSP, rate limiting, RLS, CSRF, Sentry PII, dependency audit | P0 blockers before any public traffic |
| 3 | [Scalability](./03-scalability.md) | Pagination, full-text search, background jobs, Realtime, infra roadmap | Keyset pagination, email decoupling |
| 4 | [Libraries](./04-libraries.md) | Recommended additions, what to avoid, priority-ordered | Upstash rate limit, env validation, Inngest |
| 5 | [Industry Standards](./05-industry-standards.md) | TypeScript, testing, A11y, API design, CI/CD, observability | Testing pyramid, accessibility gaps |
| 6 | [Suggested Features](./06-suggested-features.md) | 15 features prioritised by value vs. effort | Inspection scheduling, messaging, map view |
| 7 | [Production Readiness](./07-production-readiness.md) | Scored checklist — P0/P1/P2 items to fix before launch | **Start here if preparing for launch** |

---

## Current Overall Score: 52 / 100 🔴

| Category | Score |
|---|---|
| Security | 5 / 10 |
| Performance | 7 / 10 |
| Reliability | 5 / 10 |
| Observability | 6 / 10 |
| Testing | 3 / 10 |
| Database | 6 / 10 |
| DevOps / CI | 4 / 10 |
| Accessibility | 6 / 10 |

---

## Quick-Start: What to Fix First

### This week (P0 — launch blockers)
1. Verify RLS is active on all Supabase tables → `02-security.md §2 / 07-production-readiness.md P0-1`
2. Add rate limiting to `/api/auth/otp` and `/api/enquiries` → `04-libraries.md §1.1`
3. Add Content Security Policy header → `02-security.md §2.1`
4. Move Sentry DSN to environment variable → `02-security.md §2.5`

### Next sprint (P1 — before marketing)
5. Remove `force-dynamic` from `src/app/page.tsx` → `01-performance.md §2.2`
6. Convert `(authenticated)/layout.tsx` to Server Component → `01-performance.md §2.1`
7. Add GitHub Actions CI pipeline → `07-production-readiness.md P1-4`
8. Add `@t3-oss/env-nextjs` for safe env var access → `04-libraries.md §2.2`
9. Write unit tests for `authorization.ts` and all Zod validators → `05-industry-standards.md §2`
10. Add `@vercel/analytics` + `@vercel/speed-insights` → `04-libraries.md §3.4`

### Next quarter (P2 — before scaling)
11. Keyset pagination for property listings → `03-scalability.md §3.1`
12. Full-text search index on properties → `03-scalability.md §3.2`
13. Decouple email with Inngest → `03-scalability.md §3.3`
14. Build inspection scheduling UI → `06-suggested-features.md §1.3`
15. Build map view for listings → `06-suggested-features.md §2.4`

---

## Stack Reference

```
Frontend:      Next.js 16.1.5 · React 19.2.3 · TypeScript 5
Styling:       Tailwind CSS v4 · Geist font
State:         TanStack Query v5 (server state) · nuqs (URL state)
Auth:          Supabase Auth (magic link / OTP) · @supabase/ssr
Database:      Supabase PostgreSQL · Row Level Security · JSONB
Storage:       Supabase Storage (images, documents)
Email:         Resend (transactional sending) · React Email (JSX templates, preview server on :3001)
Maps:          @react-google-maps/api
Monitoring:    Sentry (errors + tracing)
Testing:       Playwright (E2E smoke tests)
Bundler:       Turbopack (Next.js 16 default)
```

