# API Routes Refactoring Examples — reKro

> Updated: March 29, 2026 · Examples based on the helpers that actually exist in the repo

---

## 1. Preferred helpers in the current codebase

These are the helpers you should refactor toward today:

- `precheck()`
- `successResponse()`
- `errorResponse()`
- `dbErrorResponse()`
- `logServerError()`
- `checkRateLimit()`

Do **not** refactor toward `withAuth()` / `withRole()` wrappers unless you implement them first. They are not present in the current repo.

---

## 2. Example: route with auth boilerplate → `precheck({ auth: true })`

### Before

```ts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthForApi();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .select(`*, user_application_profile (*)`)
      .eq("id", user.id)
      .single();

    if (error) {
      return errorResponse("Failed to fetch profile", 500);
    }

    return successResponse(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse("Internal server error", 500);
  }
}
```

### After

```ts
export async function GET(request: NextRequest) {
  const check = await precheck(request, { auth: true });
  if (!check.ok) return check.error;

  const { user } = check;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select(`*, user_application_profile (*)`)
    .eq("id", user.id)
    .single();

  if (error) {
    return dbErrorResponse("user/profile get", error, "Failed to fetch profile");
  }

  return successResponse(data);
}
```

### Why this is better

- auth failure handling is centralized
- CSRF/auth policy is consistent with the rest of the app
- DB errors become sanitized and logged structurally

---

## 3. Example: public mutation → `precheck()` + rate limiting

### Before

```ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = body.email;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) return errorResponse(error.message, 400);
  return successResponse({ ok: true });
}
```

### After

```ts
export async function POST(request: NextRequest) {
  const check = await precheck(request);
  if (!check.ok) return check.error;

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email : "";
  const ip = getRequestIp(request);

  const rateLimit = await checkRateLimit({
    key: `otp:${email}:${ip}`,
    maxRequests: 5,
    windowSeconds: 600,
  });

  if (!rateLimit.allowed) {
    return errorResponse(
      "Too many OTP requests. Please wait before trying again.",
      429,
      undefined,
      { additionalHeaders: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) {
    logServerError("auth/otp", error);
    return errorResponse("Failed to send magic link", 400);
  }

  return successResponse({ ok: true });
}
```

---

## 4. Example: role/ownership-sensitive mutation

### Before

```ts
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuthForApi();
    const body = await request.json();

    if (user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    // mutation logic...
    return successResponse({ ok: true });
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}
```

### After

```ts
export async function PATCH(request: NextRequest) {
  const check = await precheck(request, { auth: true, roles: ["admin"] });
  if (!check.ok) return check.error;

  // mutation logic...
  return successResponse({ ok: true });
}
```

### When not to use `roles`

If access depends on **ownership** rather than just role, keep the explicit fetch-and-check pattern.

Example:
- fetch the property/application
- verify `created_by === user.id`
- allow admin override if needed

---

## 5. Example: optional-auth route should stay explicit

Some routes should **not** be forced into authenticated wrappers.

### Correct pattern

```ts
export async function POST(request: NextRequest) {
  const check = await precheck(request);
  if (!check.ok) return check.error;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // authenticated flow
  } else {
    // guest flow
  }

  return successResponse({ ok: true });
}
```

This matches the current enquiries route design.

---

## 6. Example: convert plain DB failure handling to `dbErrorResponse()`

### Before

```ts
if (updateError) {
  console.error("Update failed", updateError);
  return errorResponse("Failed to update record", 500);
}
```

### After

```ts
if (updateError) {
  return dbErrorResponse("record update", updateError, "Failed to update record");
}
```

### Benefit

- less repeated logging code
- consistent structured server logs
- safer client responses

---

## 7. Practical migration strategy

### Phase 1 — standardize current routes

Refactor existing handlers toward:
- `precheck()`
- `dbErrorResponse()`
- `checkRateLimit()` where appropriate

### Phase 2 — fill remaining gaps

Highest-value follow-ups:
- add app-side rate limiting to phone verification routes
- normalize DB error handling in remaining handlers
- add route-level tests for CSRF/auth/rate limits

### Phase 3 — only then consider wrappers

If the codebase later shows clear repetition that `precheck()` cannot solve cleanly, then consider introducing a thin wrapper helper. Until then, stick to the current conventions.

---

## 8. Summary

### Refactor toward what exists today

✅ Use `precheck()` for auth/CSRF preflight
✅ Use `dbErrorResponse()` for DB failures
✅ Use `checkRateLimit()` for abuse-prone endpoints
✅ Keep optional-auth routes explicit
✅ Keep ownership checks explicit where needed

### Do not refactor toward imaginary abstractions

❌ `withAuth()`
❌ `withRole()`
❌ layout-based API protection
