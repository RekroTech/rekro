# API Routes Refactoring Examples

## New Helper Functions Available

### 1. `withAuth()` - Simplified Authentication Wrapper

**Before:**
```typescript
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuthForApi();
        const supabase = await createClient();
        
        // Your logic here
        
        return successResponse(data);
    } catch (error) {
        console.error("Error:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        return errorResponse("Internal server error", 500);
    }
}
```

**After:**
```typescript
export const GET = withAuth(async (request, user) => {
    const supabase = await createClient();
    
    // Your logic here - user is guaranteed to exist
    
    return successResponse(data);
});
```

### 2. `withRole()` - Role-Based Access Control

**Before:**
```typescript
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuthForApi();
        
        if (user.role !== "landlord" && user.role !== "admin") {
            return errorResponse("Forbidden", 403);
        }
        
        // Your logic here
        
        return successResponse(data);
    } catch (error) {
        // ... error handling
    }
}
```

**After:**
```typescript
export const POST = withRole(["landlord", "admin"], async (request, user) => {
    // Your logic here - user is guaranteed to have landlord or admin role
    
    return successResponse(data);
});
```

### 3. `requireRole()` - Role Check Without Wrapper

**When to use:** When you need more complex logic or multiple handlers

```typescript
export async function POST(request: NextRequest) {
    try {
        // Only landlords and admins can create properties
        const user = await requireRole("landlord", "admin");
        
        const supabase = await createClient();
        // Your logic here
        
        return successResponse(data);
    } catch (error) {
        if (error instanceof Error && error.message === "Forbidden") {
            return errorResponse("Forbidden - Only landlords can create properties", 403);
        }
        // ... other error handling
    }
}
```

## Real-World Refactoring Examples

### Example 1: User Profile Route

**Current code:** `app/api/user/profile/route.ts`

```typescript
export async function GET() {
    try {
        const authUser = await requireAuthForApi();
        const supabase = await createClient();

        const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select(`*, user_application_profile (*)`)
            .eq("id", authUser.id)
            .single();

        if (profileError) {
            return errorResponse("Failed to fetch profile", 500);
        }

        return successResponse(profileData);
    } catch (error) {
        console.error("Profile fetch error:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        return errorResponse("Internal server error", 500);
    }
}
```

**Refactored with `withAuth`:**

```typescript
export const GET = withAuth(async (request, user) => {
    const supabase = await createClient();

    const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select(`*, user_application_profile (*)`)
        .eq("id", user.id)
        .single();

    if (profileError) {
        return errorResponse("Failed to fetch profile", 500);
    }

    return successResponse(profileData);
});
```

**Benefits:**
- 13 lines removed
- No try-catch boilerplate
- Cleaner, more focused logic
- `user` is guaranteed to exist (type-safe)

---

### Example 2: Property Creation Route

**Current code:** `app/api/property/route.ts`

```typescript
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuthForApi();
        const supabase = await createClient();

        // Parse multipart form data
        const formData = await request.formData();
        // ... property creation logic
        
        return successResponse(property, 201);
    } catch (error) {
        console.error("Property creation error:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        return errorResponse("Internal server error", 500);
    }
}
```

**Refactored with `withRole`:**

```typescript
export const POST = withRole(["landlord", "admin"], async (request, user) => {
    const supabase = await createClient();

    // Parse multipart form data
    const formData = await request.formData();
    // ... property creation logic
    
    return successResponse(property, 201);
});
```

**Benefits:**
- Only landlords and admins can create properties (enforced automatically)
- No manual role checking
- 403 Forbidden error handled automatically
- Cleaner code

---

### Example 3: Application Submission Route

**Current code:** `app/api/application/submit/route.ts`

Could be refactored to:

```typescript
export const POST = withAuth(async (request, user) => {
    const supabase = await createClient();
    const rawBody = await request.json();

    // Validate request body with Zod
    let body;
    try {
        body = SubmitApplicationSchema.parse(rawBody);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid request data";
        return errorResponse(`Validation error: ${message}`, 400);
    }

    // Submit application logic
    const { data, error } = await supabase
        .from("applications")
        .update({ status: "submitted", submitted_at: getCurrentTimestamp() })
        .eq("id", body.applicationId)
        .eq("user_id", user.id) // Security: ensure user owns the application
        .select()
        .single();

    if (error) {
        return errorResponse("Failed to submit application", 500);
    }

    return successResponse(data);
});
```

---

## Migration Strategy

### Phase 1: New Routes (Immediate)
All new API routes should use `withAuth()` or `withRole()` from the start.

### Phase 2: High-Traffic Routes (Week 1)
Refactor your most-called routes first:
- `api/user/profile/route.ts`
- `api/application/route.ts`
- `api/application/status/route.ts`

### Phase 3: All Protected Routes (Week 2-3)
Gradually refactor remaining routes during normal development.

### Phase 4: Monitoring (Ongoing)
- No functional changes expected
- Monitor error logs to ensure auth errors are still caught properly
- All existing tests should pass without modification

---

## When NOT to Use These Helpers

### 1. Public Routes
```typescript
// ✅ CORRECT - Don't use withAuth for public routes
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    // ... public data fetching
}
```

### 2. Optional Auth Routes
```typescript
// ✅ CORRECT - Manual check for optional auth
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // Authenticated user flow
    } else {
        // Guest user flow
    }
}
```

### 3. Complex Error Handling
```typescript
// ✅ CORRECT - When you need custom error messages per scenario
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuthForApi();
        
        // Complex business logic with specific error messages
        if (someCondition) {
            return errorResponse("Specific business rule violation", 400);
        }
        
        // ...
    } catch (error) {
        // Custom error handling
    }
}
```

---

## Testing

All existing tests should continue to work without modification. The helpers don't change the API behavior, only simplify the code.

**Test that should still pass:**
- Authentication rejection returns 401
- Authorization rejection returns 403
- Successful requests work as before
- Error handling returns 500 for unexpected errors

---

## Summary

✅ **Use `withAuth()`** for standard authenticated routes
✅ **Use `withRole()`** for role-restricted routes
✅ **Use `requireRole()`** when you need more control
✅ **Keep current pattern** for public/optional-auth routes

Your API architecture is already solid. These helpers just reduce boilerplate! 🎉

