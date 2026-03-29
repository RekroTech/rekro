# Security Analysis — reKro

> Audit date: March 29, 2026 · Stack: Next.js 16 / React 19 / Supabase / Sentry

---

## 1. Current Security Posture

| Area | Status |
|---|---|
| HTTPS enforcement (HSTS) | ✅ `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` in `next.config.ts` |
| Clickjacking protection | ✅ `X-Frame-Options: SAMEORIGIN` |
| MIME sniffing protection | ✅ `X-Content-Type-Options: nosniff` |
| Legacy XSS header | ✅ `X-XSS-Protection: 1; mode=block` |
| Referrer policy | ✅ `origin-when-cross-origin` |
| Content Security Policy | ✅ `Content-Security-Policy` header configured in `next.config.ts` |
| API route cache | ✅ `Cache-Control: no-store, must-revalidate` for `/api/:path*` in `next.config.ts` |
| CSRF protection for mutations | ✅ `precheck()` validates `Origin` / `Referer` on mutating requests by default |
| Auth validation in API routes | ✅ `precheck({ auth: true })` delegates to `requireAuthForApi()` / `requireRole()` |
| Route-level role checks | ✅ `requireRole()` exists and `precheck({ roles: [...] })` supports RBAC |
| Independent app-side rate limiting | ✅ Implemented for `/api/auth/otp`, `/api/enquiries`, and `/api/property` via `checkRateLimit()` |
| Distributed limiter support | ✅ Upstash Redis is wired when env vars exist; in-memory fallback exists for local/dev |
| Phone verification throttling | ⚠️ `send` / `verify` routes rely on Supabase provider throttling and error mapping, not app-side `checkRateLimit()` |
| Honeypot anti-spam | ✅ `website` honeypot field in enquiries flow |
| Sentry PII handling | ✅ `sendDefaultPii: false` and `beforeSend` strips `email` and `ip_address` |
| Sentry DSN handling | ✅ DSN now comes from `NEXT_PUBLIC_SENTRY_DSN` |
| Robots / sitemap | ✅ `src/app/robots.ts` and `src/app/sitemap.ts` are present |
| Secrets exposure posture | ✅ Public keys are limited to intended `NEXT_PUBLIC_*` values; server secrets validated through `src/env.ts` |
| Supabase RLS evidence | ⚠️ Only partially evidenced in committed SQL; repo does not yet prove full table-by-table coverage |
| Session refresh middleware scope | ⚠️ `src/proxy.ts` only refreshes sessions for `/dashboard/*`, `/settings/*`, `/account/*`, `/accommodations/*` |

---

## 2. Priority Issues (Current)

### 2.1 RLS posture is still only partially evidenced in git

**Risk:** HIGH — if dashboard policies drift from version-controlled SQL, direct client access could read/write rows outside intended boundaries.

**Current evidence in repo:**
- `database/tables/enquiries.sql` explicitly enables RLS and defines an insert policy.
- `database/tables/application_snapshot.sql` includes a policy definition.
- `database/storage/property_storage.sql` contains storage policies.
- `database/policies/` is currently empty.
- Many table SQL files under `database/tables/` do not show committed policy definitions.

**Required actions:**
1. Export and commit canonical RLS SQL for all active app tables.
2. Add explicit `ENABLE ROW LEVEL SECURITY` statements where missing.
3. Add a matrix of table × action × role.
4. Validate staging/production state against the committed baseline.

---

### 2.2 Phone verification routes do not yet use app-side rate limiting

**Risk:** MEDIUM — authenticated phone verification endpoints are lower-risk than public OTP/email endpoints, but still abuse-prone.

**Current state:**
- `/api/user/phone-verification/send` and `/api/user/phone-verification/verify` require auth via `precheck({ auth: true })`.
- They map Supabase OTP errors and return sanitized responses.
- They do **not** currently call `checkRateLimit()`.

**Recommended fix:**
- Add a per-user and/or per-phone limiter using the existing `checkRateLimit()` helper.
- Return `429` with `Retry-After`, matching the OTP and enquiry routes.

---

### 2.3 Auth cookie/session refresh is intentionally scoped, not global

**Risk:** MEDIUM — this is not necessarily a flaw, but it should be documented because assumptions can drift.

**Current state:**
- `src/proxy.ts` matcher covers only:
  - `/dashboard/:path*`
  - `/settings/:path*`
  - `/account/:path*`
  - `/accommodations/:path*`
- Session refresh is therefore **not** applied to all routes.

**Recommended action:**
- Either broaden scope if global refresh is required,
- or keep the current narrower matcher and document it as an intentional performance choice.

---

### 2.4 CSP is present, but still permissive in places

**Risk:** LOW → MEDIUM — the app is materially safer with CSP than without it, but `'unsafe-inline'` remains in `script-src` and `style-src`.

**Current state:**
- Google Maps and fonts are explicitly allowed.
- `frame-ancestors 'none'` is present.
- Inline script/style allowances remain for compatibility.

**Recommended hardening:**
1. Reduce inline allowances where practical.
2. Consider nonces/hashes for inline content that must remain.
3. Add CSP reporting once deployment tooling is ready.

---

## 3. CSRF Coverage Snapshot

`precheck()` defaults CSRF mode to `auto`, which validates `Origin` / `Referer` for mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`).

Current route scan shows this pattern on mutating handlers including:
- `/api/enquiries`
- `/api/auth/otp`
- `/api/user/phone-verification/send`
- `/api/user/phone-verification/verify`
- `/api/property`
- `/api/property/[id]`
- `/api/property/[id]/media`
- `/api/application`
- `/api/application/submit`
- `/api/application/status`
- `/api/application/withdraw`
- `/api/application/snapshot`

**Residual risk:** this is a convention, not a compiler guarantee. New routes can still skip `precheck()` unless protected by tests or lint rules.

---

## 4. Rate Limiting Coverage Snapshot

| Route | Status | Notes |
|---|---|---|
| `/api/auth/otp` | ✅ App-side limiter | Keyed by normalized email + IP |
| `/api/enquiries` | ✅ App-side limiter | Keyed by authenticated user or guest identity + IP |
| `/api/property` | ✅ App-side limiter | Keyed by authenticated user + IP |
| `/api/user/phone-verification/send` | ⚠️ Provider-only | Relies on Supabase throttling/error handling |
| `/api/user/phone-verification/verify` | ⚠️ Provider-only | No app-side limiter yet |

---

## 5. Auth Security Checklist

- [x] OTP / magic-link auth (no password storage in app DB)
- [x] Server-side auth checks on protected API routes via `precheck({ auth: true })`
- [x] Role checks available through `requireRole()` and `precheck({ roles: [...] })`
- [x] CSRF origin/referer validation on mutating routes using `precheck()`
- [x] App-side rate limiting on the highest-risk public endpoints (`/api/auth/otp`, `/api/enquiries`)
- [x] Sanitized Sentry configuration with PII stripping
- [ ] Add app-side rate limiting to phone verification routes
- [ ] Verify full RLS coverage table-by-table from committed SQL
- [ ] Add security regression tests for CSRF, unauthorized mutation attempts, and rate-limit enforcement
- [ ] Add audit logging for privileged/admin actions

---

## 6. Dependency Security

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
- `@upstash/ratelimit`
- `zod`

---

## 7. Recommended Next Security Sprint

1. Commit a full RLS baseline for all active tables and storage policies.
2. Add app-side rate limiting to phone verification send/verify routes.
3. Add automated tests that fail when mutating routes skip `precheck()`.
4. Start structured security regression coverage for CSRF, authz, and abuse throttling.
