# API Routes Best Practices — reKro

> Updated: March 29, 2026 · Based on the current `src/app/api/**/route.ts` implementation

---

## 1. Current route-handler model

The app already follows the correct high-level pattern for Next.js App Router APIs:

- all HTTP handlers live under `src/app/api/**/route.ts`
- page/layout auth and API auth are treated separately
- mutating handlers use a shared preflight helper: `precheck()`
- DB failures can be sanitized through `dbErrorResponse()`
- abuse-prone endpoints can use `checkRateLimit()`

### Current route categories

| Route type | Examples | Current pattern |
|---|---|---|
| Public | `/api/auth/callback`, `/api/voiceflow/properties/search` | No auth required |
| Public mutation | `/api/auth/otp`, `/api/enquiries` | `precheck()` for CSRF + optional rate limiting |
| Authenticated mutation | `/api/property`, `/api/application/*`, `/api/user/phone-verification/*` | `precheck(request, { auth: true })` |
| Authenticated read/write | `/api/user/profile` | `precheck(request, { auth: true })` |
| Role-restricted mutation | selected admin/owner flows | `precheck(..., { roles: [...] })` or explicit ownership checks |

---

## 2. Important architectural rule

### Do **not** try to protect API routes with page route groups/layouts

`src/app/(authenticated)/layout.tsx` is for page rendering only.

It does **not** secure `src/app/api/**` handlers.

API routes must protect themselves explicitly.

That is already the right architecture for this repo.

---

## 3. Standard handler shape in this codebase

### 3.1 Public mutation with CSRF check

```ts
export async function POST(request: NextRequest) {
  const check = await precheck(request);
  if (!check.ok) return check.error;

  // validate input
  // optional rate limiting
  // business logic
  return successResponse({ ok: true });
}
```

### 3.2 Authenticated mutation

```ts
export async function POST(request: NextRequest) {
  const check = await precheck(request, { auth: true });
  if (!check.ok) return check.error;

  const { user } = check;
  // business logic using authenticated user
  return successResponse({ ok: true });
}
```

### 3.3 Role-restricted mutation

```ts
export async function PATCH(request: NextRequest) {
  const check = await precheck(request, { auth: true, roles: ["admin"] });
  if (!check.ok) return check.error;

  const { user } = check;
  return successResponse({ ok: true, userId: user.id });
}
```

---

## 4. Use the shared API helpers that already exist

Current helpers in `src/app/api/utils.ts`:

- `precheck()`
- `errorResponse()`
- `successResponse()`
- `dbErrorResponse()`
- `logServerError()`
- `checkRateLimit()`
- `getRequestIp()`

### Recommended usage order inside a handler

1. `precheck()`
2. parse request body / params
3. validate with Zod
4. apply rate limiting if endpoint is abuse-prone
5. run business logic
6. return `successResponse()`
7. on DB failure, prefer `dbErrorResponse()`

---

## 5. Auth patterns used in this app

### `precheck()` is the default

Use `precheck()` for most route handlers because it centralizes:
- CSRF checks
- auth checks
- role checks
- normalized 401/403/500 error responses for auth failures

### `requireAuthForApi()` / `requireRole()` are still valid

Use them directly only when:
- you are outside the normal route precheck flow, or
- a helper function needs a guaranteed authenticated user

### Optional auth remains manual

For endpoints like enquiries, guests are allowed, so auth is checked manually on the Supabase client:

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const isAuthenticated = !!user;
```

---

## 6. Rate limiting guidance

The current repo already uses `checkRateLimit()` on:
- `/api/auth/otp`
- `/api/enquiries`
- `/api/property`

### When to add it

Use `checkRateLimit()` on endpoints that are:
- public and easy to spam
- expensive to run
- capable of triggering external side effects (emails, OTPs, uploads)

### Example

```ts
const rateLimit = await checkRateLimit({
  key: `otp:${email}:${ip}`,
  maxRequests: 5,
  windowSeconds: 600,
});

if (!rateLimit.allowed) {
  return errorResponse(
    "Too many requests",
    429,
    undefined,
    { additionalHeaders: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
  );
}
```

---

## 7. Error-handling guidance

### Prefer sanitized DB failures

```ts
if (error) {
  return dbErrorResponse("application submit", error, "Failed to submit application");
}
```

This gives you:
- structured server logging
- consistent client-safe errors
- less repetition

### Do not leak raw provider/database errors to clients

Bad:

```ts
return errorResponse(error.message, 500);
```

Good:

```ts
return dbErrorResponse("profile fetch", error, "Failed to fetch profile");
```

---

## 8. Input validation guidance

Use Zod schemas from `@/lib/validators` for any non-trivial request input.

Patterns already present in the repo:
- `Schema.parse(...)` when you want throw-on-failure behavior inside a local try/catch
- `Schema.safeParse(...)` when you want a branch-based result

### Good example

```ts
const rawBody = await request.json();
const parsed = EnquiryRequestSchema.safeParse(rawBody);
if (!parsed.success) {
  return errorResponse(`Validation error: ${parsed.error.message}`, 400);
}
```

---

## 9. Ownership and authorization checks

Role checks are not enough for every route.

For entity-level mutations, continue verifying ownership explicitly.

Example pattern already used in property routes:
- authenticate the user
- fetch the resource
- confirm the user owns it or has elevated privileges
- only then mutate it

---

## 10. What not to document or build unless it exists

Avoid introducing doc patterns that claim the repo already has these unless implemented:
- `withAuth()` wrapper
- `withRole()` wrapper
- API protection through layout route groups
- global middleware protection for all API routes

Those may be future refactors, but they are **not** the current implementation.

---

## 11. Recommended next improvements

1. Apply `dbErrorResponse()` more consistently across remaining route handlers.
2. Add app-side rate limiting to phone verification send/verify routes.
3. Add tests that fail when mutating routes skip `precheck()`.
4. Standardize a richer error envelope only if you are ready to migrate consumers consistently.
