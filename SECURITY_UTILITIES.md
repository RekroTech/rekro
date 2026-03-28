# Security Utilities Guide

## CSRF Protection

### Overview
The `validateCsrfOrigin()` function in `src/app/api/utils.ts` provides Cross-Site Request Forgery (CSRF) protection by validating that API requests originate from your application's domain.

### How It Works
1. Checks the `Origin` header (most reliable, sent by browsers on cross-origin requests)
2. Falls back to `Referer` header if Origin is not available
3. Validates against `NEXT_PUBLIC_APP_URL` environment variable
4. Allows localhost for development

### Usage

Add to any `POST`, `PATCH`, or `DELETE` API route:

```typescript
import { NextRequest } from "next/server";
import { errorResponse, successResponse, validateCsrfOrigin } from "@/app/api/utils";

export async function POST(request: NextRequest) {
  // Validate CSRF first
  const csrf = validateCsrfOrigin(request);
  if (!csrf.allowed) {
    console.warn(`CSRF violation: ${csrf.reason}`);
    return errorResponse(csrf.reason || "Forbidden", 403);
  }

  // Safe to proceed with state-changing operation
  // ... rest of handler
}
```

### Example: Enquiries Route

```typescript
// src/app/api/enquiries/route.ts
export async function POST(request: NextRequest) {
  // Step 1: CSRF validation
  const csrf = validateCsrfOrigin(request);
  if (!csrf.allowed) {
    return errorResponse("Invalid origin", 403);
  }

  // Step 2: Parse and validate input
  const rawBody = await request.json();
  const body = EnquiryRequestSchema.parse(rawBody);

  // Step 3: Process request
  // ... rest of handler
}
```

### Routes That Need CSRF Protection (Priority)

**HIGH PRIORITY (Unauthenticated):**
- `POST /api/enquiries` - Form submission
- `POST /api/auth/otp` - Login via email

**MEDIUM PRIORITY (Authenticated):**
- `POST /api/property` - Create property
- `PATCH /api/property/[id]` - Update property
- `DELETE /api/property/[id]` - Delete property
- `POST /api/application/*` - Submit application
- `PATCH /api/application/*` - Update application

**Suggested Implementation:** Create a wrapper function:

```typescript
export function withCsrf(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const csrf = validateCsrfOrigin(request);
    if (!csrf.allowed) {
      return errorResponse(csrf.reason || "Forbidden", 403);
    }
    return handler(request);
  };
}

// Usage:
export const POST = withCsrf(async (request) => {
  // Handler code
});
```

### Configuration

The CSRF validator uses these environment variables:
- `NEXT_PUBLIC_APP_URL` - Your production app URL
- Hardcoded localhost origins for development (`http://localhost:3000`, `http://localhost:3001`)

To customize allowed origins, edit the `validateCsrfOrigin()` function in `src/app/api/utils.ts`.

### Testing CSRF Protection

**Test rejection (should return 403):**
```bash
curl -X POST http://localhost:3000/api/enquiries \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"unit_id": "123", "message": "test"}'
```

**Test acceptance (should work):**
```bash
curl -X POST http://localhost:3000/api/enquiries \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"unit_id": "123", "message": "test"}'
```

### Best Practices

1. **Always validate CSRF on state-changing routes** (POST, PATCH, DELETE)
2. **Don't rely on CSRF protection alone** - combine with:
   - Input validation (Zod schemas)
   - Rate limiting
   - Authentication checks
3. **Log CSRF violations** for security monitoring
4. **Consider adding CSRF tokens** for additional protection (future enhancement)

---

## Rate Limiting

The `checkRateLimit()` utility is available in `src/app/api/utils.ts` but is in-memory only. For production, integrate with Upstash or Redis:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Then create a new utility function for distributed rate limiting.

---

## Other Security Utilities

- `withAuth()` - Wraps handlers that require authentication
- `withRole()` - Wraps handlers that require specific roles
- `validateRequiredFields()` - Validates required body fields

