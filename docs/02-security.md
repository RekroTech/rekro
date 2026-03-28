# Security Analysis — reKro

> Audit date: March 28, 2026 · Stack: Next.js 16 / React 19 / Supabase / Sentry

---

## 1. Current Security Posture

| Area | Status |
|---|---|
| HTTPS enforcement (HSTS) | ✅ `max-age=63072000; includeSubDomains; preload` in `next.config.ts` |
| Clickjacking protection | ✅ `X-Frame-Options: SAMEORIGIN` |
| MIME sniffing protection | ✅ `X-Content-Type-Options: nosniff` |
| XSS header | ✅ `X-XSS-Protection: 1; mode=block` |
| Referrer policy | ✅ `origin-when-cross-origin` |
| Content Security Policy | ✅ `Content-Security-Policy` header configured in `next.config.ts` |
| API route cache | ✅ `Cache-Control: no-store, must-revalidate` on `/api/*` |
| CSRF protection for mutations | ✅ Implemented via `precheck()` (`Origin`/`Referer` validation for non-safe methods) |
| Auth: server-side validation | ✅ `precheck({ auth: true })` uses `requireAuthForApi()` / `requireRole()` |
| Auth: middleware session refresh scope | ⚠️ `updateSession()` runs only on matched protected routes in `src/proxy.ts`, not globally |
| Input validation | ✅ Zod validation used on key mutation routes (e.g. enquiries, applications, phone verification) |
| Honeypot anti-spam | ✅ `website` honeypot field in enquiries flow |
| RBAC | ✅ Role checks enforced through `requireRole()` where required |
| OTP partial rate-limit | ⚠️ OTP routes pass through Supabase rate-limit errors (429) but no independent app-side limiter |
| Independent API rate limiting | ❌ No active IP/user limiter wired into API handlers (`checkRateLimit()` exists but is not used) |
| Supabase RLS evidence | ⚠️ Partial evidence in SQL files; coverage is not fully verified for all tables |
| Sentry PII | ✅ `sendDefaultPii: false` + `beforeSend` strips `email` and `ip_address` in all Sentry configs |
| Sentry DSN in source | ✅ DSN now loaded from `NEXT_PUBLIC_SENTRY_DSN` (env-based) |
| robots/sitemap | ✅ `src/app/robots.ts` and `src/app/sitemap.ts` are present |
| Secrets exposure | ⚠️ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public; keep service-role keys server-only |

---

## 2. Priority Issues (Current)

### 2.1 No independent rate limiting on sensitive endpoints

**Risk:** HIGH — unauthenticated or low-friction endpoints (`/api/auth/otp`, `/api/enquiries`) can still be abused before upstream limits effectively dampen bursts.

**Current state:**
- `src/app/api/auth/otp/route.ts` and `src/app/api/user/phone-verification/send/route.ts` map Supabase rate-limit messages to `429`.
- `checkRateLimit()` exists in `src/app/api/utils.ts` but is not wired into live handlers.

**Fix options (pick one):**
- `@upstash/ratelimit` + `@upstash/redis` (recommended on Vercel)
- Vercel-native rate limiting
- Edge middleware + durable store (Redis/KV)

---

### 2.2 RLS posture is only partially evidenced in repo

**Risk:** HIGH — without consistent table-by-table RLS enforcement, direct client access could read/write rows outside intended tenancy boundaries.

**Current evidence in codebase:**
- `database/tables/enquiries.sql` explicitly enables RLS and defines an insert policy.
- `database/tables/application_snapshot.sql` contains a policy definition.
- `database/storage/property_storage.sql` defines storage policies.
- `database/policies/` is currently empty.

**Actions required:**
1. Export/commit canonical RLS policy SQL for all app tables.
2. Confirm `ENABLE ROW LEVEL SECURITY` state table-by-table in Supabase.
3. Add a policy matrix (table x action x role) and validate with integration tests.

---

### 2.3 Auth cookie/session refresh is not global

**Risk:** MEDIUM — assumptions about global session refresh can drift from runtime behavior.

**Current state:**
- `src/proxy.ts` matcher covers only: `/dashboard/*`, `/settings/*`, `/account/*`, `/accommodations/*`.
- Session refresh is therefore scoped, not every request.

**Fix:**
- Either broaden matcher scope if global refresh is required,
- or keep scope intentionally narrow and document it explicitly (recommended if performance-conscious).

---

## 3. CSRF Coverage Snapshot

`precheck()` defaults CSRF mode to `auto`, which validates `Origin`/`Referer` for mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`).

Current API route scan indicates all mutating handlers in `src/app/api/**/route.ts` call `precheck(request, ...)`, including:
- `/api/enquiries`
- `/api/auth/otp`
- `/api/user/phone-verification/*`
- `/api/property` and `/api/property/[id]`
- `/api/application/*`

Residual risk: new routes can bypass CSRF if `precheck()` is not adopted consistently. Add lint/test guardrails to enforce usage.

---

## 4. Auth Security Checklist

- [x] OTP/magic-link auth (no password handling in app DB)
- [x] Server-side auth checks on protected API mutations (`precheck({ auth: true })`)
- [x] Role checks via `requireRole()` for admin operations
- [x] CSRF origin/referer enforcement on mutating routes using `precheck()`
- [x] OTP endpoints return `429` when Supabase reports rate limit
- [ ] Add independent app-side rate limiting on `/api/auth/otp` and `/api/enquiries`
- [ ] Verify cookie attributes (`HttpOnly`, `Secure`, `SameSite`) in production runtime
- [ ] Add security regression tests for CSRF and unauthorized mutation attempts
- [ ] Add audit logging for privileged/admin actions

---

## 5. Dependency Security

Run regularly:

```bash
npm audit
npx npm-check-updates -u --target minor
```

Priority packages to monitor:
- `next`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `@sentry/nextjs`
- `zod`

---

## 6. Recommended Next Security Sprint (Short)

1. Implement independent rate limiting on `/api/auth/otp`, `/api/enquiries`, and phone verification routes.
2. Produce and commit a full RLS policy pack with verification checklist.
3. Add an automated route test that fails if mutating handlers skip `precheck()`.
