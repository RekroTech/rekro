# Security Analysis — reKro

> Audit date: March 2026 · Stack: Next.js 16 / React 19 / Supabase / Sentry

---

## 1. Current Security Posture

| Area | Status |
|---|---|
| HTTPS enforcement (HSTS) | ✅ `max-age=63072000; includeSubDomains; preload` in `next.config.ts` |
| Clickjacking protection | ✅ `X-Frame-Options: SAMEORIGIN` |
| MIME sniffing protection | ✅ `X-Content-Type-Options: nosniff` |
| XSS header | ✅ `X-XSS-Protection: 1; mode=block` |
| Referrer policy | ✅ `origin-when-cross-origin` |
| API routes cache | ✅ `no-store, must-revalidate` on `/api/*` |
| Auth: server-side validation | ✅ `requireAuthForApi()` validates JWT on every mutation |
| Auth: middleware session refresh | ✅ `updateSession()` in middleware refreshes tokens on every request |
| Input validation | ✅ Zod schemas on all API routes (`PropertyDataSchema`, `EnquiryRequestSchema`, etc.) |
| Honeypot anti-spam | ✅ `website` field honeypot in enquiry form |
| RBAC | ✅ 5-tier role hierarchy (`user → tenant → landlord → admin → super_admin`) |
| Supabase RLS | ⚠️ Policies folder is empty — requires verification |
| Content Security Policy | ❌ No CSP header defined |
| Rate limiting | ❌ No rate limiting on API routes |
| Sentry PII | ⚠️ `sendDefaultPii: true` — sends user data to Sentry |
| Secrets exposure | ⚠️ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public; ensure no service-role key is exposed |

---

## 2. Critical Issues

### 2.1 No Content Security Policy (CSP)

**Risk:** HIGH — XSS attacks can execute arbitrary scripts.

**Fix:** Add a CSP header in `next.config.ts`:

```ts
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://maps.googleapis.com", // tighten after testing
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
    "connect-src 'self' https://*.supabase.co https://o4510117376294912.ingest.us.sentry.io",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-ancestors 'none'",
  ].join("; "),
}
```

Start with `Content-Security-Policy-Report-Only` to audit without breaking the app.

---

### 2.2 No rate limiting on API routes

**Risk:** HIGH — Unauthenticated POST `/api/enquiries` and POST `/api/auth/otp` can be
abused to flood email inboxes or exhaust Supabase quotas.

**Fix options (pick one):**

- **Upstash Rate Limit** (recommended for Vercel/edge): `@upstash/ratelimit` + `@upstash/redis`
- **Vercel Rate Limiting** (no extra infra): native in Vercel dashboard
- **next-rate-limit** package for self-hosted

```ts
// Example using @upstash/ratelimit
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute per IP
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) return errorResponse("Too many requests", 429);
  // ...
}
```

---

### 2.3 Row Level Security (RLS) policies not verified

**Risk:** HIGH — Without confirmed RLS policies, any authenticated user could read or
mutate any row directly via the Supabase client.

**Actions required:**
1. Confirm RLS is enabled on all tables in the Supabase dashboard
2. Add policy SQL files to `database/policies/`
3. Minimum required policies:
   - `properties`: Read = published only (or owner); Write = landlord/admin
   - `users`: Read = own row; Write = own row
   - `applications`: Read = own row or property owner; Write = own row
   - `unit_likes`: Read/Write = own rows only
   - `user_roles`: Read = own row; Write = admin only

---

### 2.4 `sendDefaultPii: true` in Sentry

**Risk:** MEDIUM — Email addresses, IP addresses, and session cookies are sent to Sentry.
This may conflict with GDPR/Privacy Act obligations depending on your jurisdiction.

**Fix:**

```ts
// sentry.server.config.ts & sentry.edge.config.ts
sendDefaultPii: false,
// Capture user ID only (no email):
beforeSend(event) {
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }
  return event;
},
```

---

### 2.5 Sentry DSN exposed in source

**Risk:** LOW-MEDIUM — The Sentry DSN (`https://cc3d181...`) is in committed source code.
While a DSN is designed to be public for browser-side reporting, it allows anyone to
submit fake events to your Sentry project.

**Fix:** Move DSN to an environment variable:

```ts
dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
```

Add to `.env.local` and your hosting provider's environment settings.

---

### 2.6 Missing CSRF protection on state-changing API routes

**Risk:** MEDIUM — Next.js App Router does not automatically add CSRF tokens.

**Fix:** For `POST`/`PATCH`/`DELETE` API routes that accept `application/json`, verify
the `Origin` or `Referer` header:

```ts
// src/app/api/utils.ts — add to all mutation handlers
const origin = request.headers.get("origin");
const allowed = process.env.NEXT_PUBLIC_APP_URL;
if (origin && origin !== allowed) {
  return errorResponse("Forbidden", 403);
}
```

Alternatively, use a CSRF library like `oslo/csrf`.

---

### 2.7 No `robots.txt` or `sitemap.xml`

**Risk:** LOW — Sensitive API routes and authenticated pages may be indexed by search
engines or crawled by bots.

**Fix:** Add `src/app/robots.ts` and `src/app/sitemap.ts` using Next.js 13+ metadata API.

---

## 3. Auth Security Checklist

- [x] OTP/magic link auth (no password storage)
- [x] JWT validated server-side on every API mutation
- [x] Session tokens refreshed via middleware on every request
- [x] Role checked before property management actions
- [ ] Add `SameSite=Strict` cookie attribute verification in middleware
- [ ] Implement token rotation alerts in Sentry
- [ ] Add audit log table for admin actions
- [ ] Implement account lockout after N failed OTP attempts

---

## 4. Dependency Security

Run the following regularly:

```bash
npm audit
npx npm-check-updates -u --target minor
```

Notable packages to monitor:
- `@sentry/nextjs` — frequent security patches
- `@supabase/ssr` — auth library, keep on latest
- `next` — critical security patches released regularly
- `zod` — keep on v4+ for improved type safety

