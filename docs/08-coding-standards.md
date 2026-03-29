# Coding Standards — reKro

> Last updated: March 29, 2026
> Purpose: repository-aligned implementation guide for contributors

---

## 1. Architecture mental model

### App structure at a glance

```text
src/
├── app/                         Next.js App Router pages, layouts, route handlers
│   ├── (authenticated)/        Server-guarded routes
│   ├── api/                    Route handlers
│   ├── property/[id]/          Property detail page
│   └── page.tsx                Home page browse shell (client component)
├── components/
│   ├── common/                 Shared UI primitives
│   ├── Properties/             Listing/grid/map feature components
│   ├── Profile/                Profile feature UI
│   ├── Applications/           Application dashboards and modals
│   └── providers/              Root provider composition
├── contexts/                   Global UI / cross-cutting client state
├── hooks/                      Browser/UI helper hooks
├── lib/
│   ├── hooks/                  TanStack Query and auth hooks
│   ├── queries/                Supabase query functions
│   ├── services/               Storage/upload/email-adjacent services
│   ├── supabase/               Client/server auth utilities
│   ├── utils/                  Shared helpers
│   └── validators/             Zod schemas
└── types/                      Shared TS types
```

### Current route structure

```text
/                               Public listings page (`src/app/page.tsx`)
/property/[id]                  Property detail page
/(authenticated)/applications   Authenticated application views
/(authenticated)/profile        Authenticated profile views
/api/auth/callback              GET
/api/auth/otp                   POST
/api/enquiries                  POST
/api/property                   POST
/api/property/[id]              PATCH / DELETE
/api/property/[id]/media        PATCH
/api/application                POST
/api/application/submit         POST
/api/application/status         PATCH
/api/application/withdraw       POST
/api/application/snapshot       POST
/api/user/profile               GET / PATCH
/api/user/phone-verification/send   POST
/api/user/phone-verification/verify POST
/api/voiceflow/properties/search    GET
```

**Important:** do not document or introduce route groups such as `(unauthenticated)` unless they actually exist.

---

## 2. TypeScript standards

### Keep strict typing intact

The repo currently uses `strict: true` in `tsconfig.json`. Maintain that standard.

### Prefer generated DB types

Use shared DB types from `@/types/db` rather than redefining table shapes by hand.

```ts
import type { Property, Unit, Profile } from "@/types/db";
```

### Avoid `any`

Use `unknown` for untrusted data, then narrow with Zod or explicit checks.

### Use `import type` for type-only imports

```ts
import type { SessionUser } from "@/types/auth.types";
```

### Prefer `env` for app-level env access where practical

If a module can import `@/env`, prefer that over direct `process.env`. Framework-specific files may still need raw `process.env`.

---

## 3. Component standards

### Use `"use client"` only when needed

A component should be client-side only if it needs:
- React hooks
- browser APIs
- event handlers
- mutable UI state

Do **not** add `"use client"` by default.

### Reuse shared primitives

Prefer components from `@/components/common` before introducing one-off UI.

Examples already used across the app:
- `Input`
- `Banner`
- `Loader`
- `Modal`
- `Toast`
- `Alert`
- `Icon`
- `Visual`
- skeleton components

### Lazy-load heavy UI

Follow the current `AppShell` pattern for large modals/forms.

```tsx
const PropertyForm = dynamic(
  () => import("@/components/PropertyForm").then((m) => ({ default: m.PropertyForm })),
  { ssr: false }
);
```

### Keep accessibility built in

Minimum expectations:
- labels for interactive controls
- `aria-label` for icon-only buttons
- meaningful `alt` text for images
- keyboard-safe modal behavior
- no clickable `div` replacements for buttons/links unless fully accessible

---

## 4. Data fetching standards

### Decision rule

```text
Server read in a server context?
  → use `createClient()` / `getSession()` from `@/lib/supabase/server`

Client read / caching?
  → use TanStack Query hooks from `@/lib/hooks`

Mutation?
  → go through `/api/...` route handlers
```

### Query hooks belong in `src/lib/hooks/`

Examples:
- session/auth hooks
- property list/detail hooks
- profile/application hooks

### Query functions belong in `src/lib/queries/`

Keep raw Supabase reads out of React components when the query is reusable.

### Never write directly to Supabase from client components for protected operations

Protected writes should go through route handlers so auth, CSRF, validation, and rate limiting can run.

---

## 5. API route standards

### Use `precheck()` at the top of mutating handlers

`precheck()` is the current standard in this repo.

What it can enforce:
- CSRF origin/referrer checks
- authentication
- role restrictions

Examples:

```ts
const check = await precheck(request);
if (!check.ok) return check.error;
```

```ts
const check = await precheck(request, { auth: true });
if (!check.ok) return check.error;
const { user } = check;
```

```ts
const check = await precheck(request, { auth: true, roles: ["admin"] });
if (!check.ok) return check.error;
```

### Validate inputs with Zod

Every non-trivial request body should be validated with a schema from `@/lib/validators`.

### Prefer sanitized DB failures

Use `dbErrorResponse()` / `logServerError()` for database failures where possible.

```ts
if (error) {
  return dbErrorResponse("property update", error, "Failed to update property");
}
```

### Use `checkRateLimit()` on abuse-prone routes

Current app examples:
- OTP send
- enquiries
- property creation

Follow the same pattern for future public or high-risk authenticated mutation routes.

---

## 6. Authentication & authorization

### Server-side page protection belongs in server layouts/pages

Current standard:
- authenticated layout uses `getSession()` server-side
- unauthenticated users are redirected before protected content renders

### API auth should stay explicit per route

Use:
- `precheck({ auth: true })`
- `precheck({ roles: [...] })`
- `requireAuthForApi()` / `requireRole()` only when needed directly

### Use `useRoles()` in client components

Avoid hand-writing role hierarchy checks in UI code.

```tsx
const { isAdmin, hasRoleLevel, role } = useRoles();
```

---

## 7. State management

### Current rule of thumb

```text
Server state         → TanStack Query
Global UI state      → React Context
URL/shareable state  → nuqs
Local UI state       → useState / useReducer
```

### Existing global providers

`RootProviders` currently composes:
- `ErrorBoundary`
- `NuqsAdapter`
- `QueryProvider`
- `ToastProvider`
- `AuthModalProvider`
- `PropertyFormModalProvider`
- `ProfileCompletionProvider`

Do not add a new global state library unless there is a strong, proven need.

---

## 8. Styling standards

### Prefer the existing design tokens and utility classes

Use semantic styles already present in the app such as:
- `bg-card`
- `text-foreground`
- `border-border`
- `bg-surface-muted`
- `text-text-muted`

Avoid introducing raw hex values or inconsistent ad-hoc palettes unless the design system is being intentionally extended.

### Mobile-first by default

Follow the existing responsive pattern:

```tsx
className="px-3 py-3 sm:px-4 md:px-6 lg:px-8"
```

---

## 9. Error handling

### Handle loading, empty, and error states explicitly

For async UI, prefer a complete state model:
- loading skeleton/spinner
- empty state
- error alert
- success content

### Log server errors with context

Prefer structured context:

```ts
logServerError("application submit", error, { applicationId });
```

### Do not leak DB/provider internals to clients

Client-facing errors should remain generic and actionable.

---

## 10. Testing standards

### Current baseline

- Playwright smoke tests exist in `e2e/`
- no first-party unit/component test suite is currently present

### What to add next

Highest-value targets:
- validators
- authorization helpers
- API abuse/rate-limit behavior
- CSRF rejection behavior
- profile/application business logic

---

## 11. Git & delivery conventions

### Before merging significant changes

Run at least:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

### Keep PRs narrow

Prefer:
- schema/API/UI split by logical steps
- small refactors with behavior preserved
- docs updated alongside behavior changes

---

## 12. Quick do / don’t reference

| ✅ Do | ❌ Don’t |
|---|---|
| Use `precheck()` in mutating route handlers | Re-implement auth/CSRF checks ad hoc in each route |
| Reuse `@/components/common` primitives | Create duplicate base UI components unnecessarily |
| Use `useRoles()` for client RBAC checks | Scatter manual role comparisons throughout UI |
| Prefer `env` in app modules | Spread unnecessary direct `process.env` access everywhere |
| Route protected writes through `/api/...` | Perform privileged writes directly from client components |
| Return sanitized failure messages | Leak raw DB/provider error details to end users |
