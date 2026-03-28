# API Routes Best Practices — reKro

> Analysis date: March 2026 · Stack: Next.js 16 App Router

---

## Current Structure Analysis

### Your Current Setup

```
app/
├── api/
│   ├── application/
│   │   ├── route.ts ✅ (requires auth)
│   │   ├── submit/route.ts ✅ (requires auth)
│   │   ├── snapshot/route.ts ✅ (requires auth)
│   │   ├── status/route.ts ✅ (requires auth)
│   │   └── withdraw/route.ts ✅ (requires auth)
│   ├── auth/
│   │   ├── callback/route.ts ⚪ (public)
│   │   └── otp/route.ts ⚪ (public)
│   ├── enquiries/route.ts ⚪ (optional auth - guests allowed)
│   ├── property/
│   │   ├── route.ts ✅ (requires auth)
│   │   └── [id]/route.ts ✅ (requires auth)
│   ├── user/
│   │   ├── profile/route.ts ✅ (requires auth)
│   │   └── phone-verification/
│   │       ├── send/route.ts ✅ (requires auth)
│   │       └── verify/route.ts ✅ (requires auth)
│   ├── voiceflow/
│   │   └── properties/search/route.ts ⚪ (public)
│   └── sentry-example-api/route.ts ⚪ (public test endpoint)
│
└── (authenticated)/
    └── layout.tsx (client-side auth guard)
```

**Current Auth Pattern:**
Every protected route calls `requireAuthForApi()` which:
1. Calls `getSession()` (cached with React `cache()`)
2. Throws `Error("Unauthorized")` if no user
3. Caught in try-catch and returns 401 response

---

## Best Practice Recommendation

### ❌ **Do NOT move API routes to `app/(authenticated)/api`**

**Why?**

1. **Route groups (`(authenticated)`) only affect pages, not API routes**
   - Layout components wrap React component trees
   - API routes are server endpoints that return Response objects
   - They don't render within layouts—they're separate HTTP handlers

2. **The `(authenticated)/layout.tsx` is a Client Component**
   - Uses `useEffect` + `redirect()` which doesn't work for API routes
   - API routes need synchronous auth checks before processing the request

3. **Next.js Best Practice: API routes handle their own auth**
   - Each API route should validate authentication independently
   - This is explicit, testable, and follows the single responsibility principle

4. **Different routes have different auth requirements**
   ```typescript
   // Some routes require auth
   await requireAuthForApi();
   
   // Some routes are public
   // (no auth check)
   
   // Some routes have optional auth
   const { data: { user } } = await supabase.auth.getUser();
   ```

---

## Your Current Implementation is ✅ CORRECT

Your current approach is already following Next.js best practices:

### 1. Centralized Auth Helper

```typescript
// lib/supabase/server.ts
export async function requireAuthForApi(): Promise<SessionUser> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    return user;
}
```

### 2. Used Consistently Across Protected Routes

```typescript
// app/api/application/route.ts
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuthForApi(); // ✅ Clear, explicit
        // ... rest of handler
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        return errorResponse("Internal server error", 500);
    }
}
```

### 3. Public Routes Don't Call It

```typescript
// app/api/auth/callback/route.ts
export async function GET(request: NextRequest) {
    // ✅ No auth check - this is the callback that establishes auth
    const code = requestUrl.searchParams.get("code");
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    // ...
}
```

### 4. Optional Auth Handled Separately

```typescript
// app/api/enquiries/route.ts
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = !!user;
    
    if (!isAuthenticated) {
        // Handle as guest enquiry
    } else {
        // Handle as authenticated enquiry
    }
}
```

---

## Potential Improvements

While your current setup is correct, here are some optimizations:

### 1. Create a Middleware Helper for Role-Based Auth

```typescript
// lib/supabase/server.ts

/**
 * Require specific role(s) in API routes
 */
export async function requireRole(
    ...allowedRoles: AppRole[]
): Promise<SessionUser> {
    const user = await requireAuthForApi();
    
    if (!allowedRoles.includes(user.role)) {
        throw new Error("Forbidden");
    }
    
    return user;
}
```

**Usage:**
```typescript
// app/api/property/route.ts
export async function POST(request: NextRequest) {
    try {
        // Only landlords can create properties
        const user = await requireRole("landlord", "admin");
        // ...
    } catch (error) {
        if (error instanceof Error && error.message === "Forbidden") {
            return errorResponse("Forbidden", 403);
        }
        // ...
    }
}
```

### 2. Create Standard Error Handling Wrapper

```typescript
// app/api/utils.ts

type ApiHandler = (
    request: NextRequest,
    user: SessionUser
) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler) {
    return async (request: NextRequest) => {
        try {
            const user = await requireAuthForApi();
            return await handler(request, user);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === "Unauthorized") {
                    return errorResponse("Unauthorized", 401);
                }
                if (error.message === "Forbidden") {
                    return errorResponse("Forbidden", 403);
                }
            }
            console.error("API error:", error);
            return errorResponse("Internal server error", 500);
        }
    };
}
```

**Usage:**
```typescript
// app/api/user/profile/route.ts
export const GET = withAuth(async (request, user) => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from("users")
        .select(`*, user_application_profile (*)`)
        .eq("id", user.id) // ✅ user is guaranteed to exist
        .single();
    
    if (error) return errorResponse("Failed to fetch profile", 500);
    return successResponse(data);
});
```

### 3. Add Rate Limiting (Production Recommendation)

For production, consider adding rate limiting to your API routes:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function checkRateLimit(
    identifier: string
): Promise<{ success: boolean }> {
    const { success } = await ratelimit.limit(identifier);
    return { success };
}
```

**Usage:**
```typescript
export async function POST(request: NextRequest) {
    const user = await requireAuthForApi();
    
    // Rate limit per user
    const { success } = await checkRateLimit(user.id);
    if (!success) {
        return errorResponse("Too many requests", 429);
    }
    
    // ... rest of handler
}
```

---

## Middleware vs Layout Auth

| Aspect | API Routes (Current ✅) | Route Groups with Layout |
|--------|-------------------------|--------------------------|
| **Works for API routes** | ✅ Yes | ❌ No |
| **Works for pages** | N/A | ✅ Yes |
| **Explicit auth check** | ✅ Clear in code | ⚠️ Implicit |
| **Different auth per route** | ✅ Easy | ❌ Difficult |
| **Testability** | ✅ Isolated | ⚠️ Requires layout |
| **Type safety** | ✅ User type guaranteed | ⚠️ Need null checks |

---

## Alternative: Next.js Middleware

If you want centralized auth checking, use **middleware.ts** (not route groups):

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name) => request.cookies.get(name)?.value,
                set: (name, value, options) => {
                    response.cookies.set({ name, value, ...options });
                },
            },
        }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Protect API routes
    if (request.nextUrl.pathname.startsWith("/api/application") && !user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }
    
    return response;
}

export const config = {
    matcher: [
        "/api/application/:path*",
        "/api/user/:path*",
        "/api/property/:path*",
    ],
};
```

**Pros:**
- Runs at the edge (faster)
- Centralized auth logic
- Can protect both pages and API routes

**Cons:**
- Less explicit than per-route checks
- Harder to have route-specific auth logic
- Can't access full database (edge runtime limitations)

**For your app:** Stick with per-route auth checks. They're more flexible and maintainable.

---

## Summary

### ✅ Keep Your Current Structure

```
app/api/
├── application/route.ts → requireAuthForApi()
├── user/profile/route.ts → requireAuthForApi()
├── enquiries/route.ts → optional auth
└── auth/callback/route.ts → public
```

### ✅ Your Current Pattern is Best Practice

```typescript
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuthForApi(); // ✅
        // ... handle request
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        // ...
    }
}
```

### ✅ Optional Enhancements

1. Add `requireRole()` helper for role-based access
2. Add `withAuth()` wrapper to reduce boilerplate
3. Consider middleware for edge-level protection (production)
4. Add rate limiting with Upstash or similar

### ❌ Do NOT Do This

```typescript
// ❌ WRONG - route groups don't affect API routes
app/(authenticated)/api/user/profile/route.ts

// ❌ WRONG - layouts don't wrap API routes
export default function ApiLayout({ children }) {
    // This never runs for API routes!
}
```

---

## Checklist

- [x] API routes have explicit auth checks with `requireAuthForApi()`
- [x] Public routes (auth callback, Voiceflow) have no auth check
- [x] Optional auth routes (enquiries) use `supabase.auth.getUser()`
- [x] Auth helper uses React `cache()` to prevent duplicate DB queries
- [ ] Consider adding `requireRole()` for role-based access control
- [ ] Consider `withAuth()` wrapper to reduce try-catch boilerplate
- [ ] Add rate limiting before production launch

---

Your current implementation is **already following Next.js best practices**. Don't move anything—just consider the optional enhancements above for cleaner code.

