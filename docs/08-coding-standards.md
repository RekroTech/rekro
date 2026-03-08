# Coding Standards — reKro
> Read this before writing your first line of code.
> Last updated: March 2026
---
## Table of Contents
1. [Architecture Mental Model](#1-architecture-mental-model)
2. [TypeScript Standards](#2-typescript-standards)
3. [Component Standards](#3-component-standards)
4. [Data Fetching Standards](#4-data-fetching-standards)
5. [Styling Standards](#5-styling-standards)
6. [File & Folder Conventions](#6-file--folder-conventions)
7. [API Route Standards](#7-api-route-standards)
8. [Authentication & Authorisation](#8-authentication--authorisation)
9. [State Management](#9-state-management)
10. [Error Handling](#10-error-handling)
11. [Testing Standards](#11-testing-standards)
12. [Git Conventions](#12-git-conventions)
13. [Quick Reference — Do & Don''t](#13-quick-reference--do--dont)
---
## 1. Architecture Mental Model
### Stack at a glance
| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.5 — App Router, RSC, Turbopack |
| UI | React 19.2.3 + TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 + CSS-variable design tokens |
| Database / Auth | Supabase — Postgres, RLS, Storage, SSR Auth |
| Client data | TanStack Query v5 |
| URL state | nuqs v2 |
| Email | Resend |
| Maps | Google Maps / Places API |
| Chatbot | Voiceflow (`/api/voiceflow/properties/search`) |
| PDF | jsPDF (`/api/application/snapshot`) |
| Monitoring | Sentry |
| Tests | Playwright |
### Route structure
```
/                              Public listings (force-dynamic, "use client")
/property/[id]                 Property detail ("use client")
/(authenticated)/applications  Tenant applications dashboard
/(authenticated)/profile       User profile + settings
/(unauthenticated)/            Public layout variant
/api/auth/callback             GET  — Supabase OAuth / OTP redirect
/api/auth/otp                  POST — magic-link trigger
/api/property                  POST — create property + units + images (multipart)
/api/property/[id]             PATCH / DELETE
/api/application               POST — upsert draft
/api/application/submit        POST — submit for review
/api/application/status        PATCH — approve / reject (landlord+)
/api/application/withdraw      POST — withdraw
/api/application/snapshot      POST — save PDF snapshot
/api/enquiries                 POST — guest + authenticated enquiry
/api/user/profile              PATCH
/api/user/phone-verification   POST
/api/voiceflow/properties/search POST — chatbot search
```
### Where does code live?
```
Browser reads data     →  src/lib/hooks/          TanStack Query hooks
Browser raw queries    →  src/lib/queries/         pure Supabase fns, called by hooks
Browser writes         →  /api/...                 Next.js API routes (server-validated)
Server reads           →  lib/supabase/server.ts   getSession(), createClient()
Shared validation      →  src/lib/validators/      Zod schemas
Shared types           →  src/types/               TypeScript interfaces + db.ts
UI primitives          →  src/components/common/
Feature components     →  src/components/<Feature>/
```
---
## 2. TypeScript Standards
### No `any` — ever
```ts
// ✅
function getRole(user: SessionUser): AppRole { return user.role; }
// ❌
function getRole(user: any): any { return user.role; }
```
Use `unknown` for genuinely unknown external data, then narrow with Zod.
### Use generated db types — never hand-write table shapes
```ts
// ✅ — generated from Supabase schema
import type { Property, Unit, PropertyInsert } from "@/types/db";
// ❌ — do not redeclare
interface Property { id: string; title: string; }
```
Regenerate after schema changes:
```bash
npx supabase gen types typescript --project-id <ref> > src/types/db.ts
```
### `type` imports for types, `import` for values
```ts
// ✅
import type { SessionUser } from "@/types/auth.types";
import { createClient } from "@/lib/supabase/client";
// ❌
import { SessionUser } from "@/types/auth.types";
```
### Prefer `interface` for object shapes, `type` for unions
```ts
interface PropertyCardProps { property: Property; showEditButton?: boolean; }
type ListingType = "entire_home" | "room";
```
### No non-null assertions on env vars
```ts
// ✅
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
// ❌ — silent runtime failure if var is missing
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
```
---
## 3. Component Standards
### File naming
| Thing | Convention | Example |
|---|---|---|
| React component | PascalCase | `PropertyCard.tsx` |
| Hook file | camelCase | `usePropertyFilters.ts` |
| Utility | camelCase | `dateUtils.ts` |
| Types file | camelCase + `.types` | `property.types.ts` |
| API route | `route.ts` | `app/api/enquiries/route.ts` |
### `"use client"` only when required
App Router defaults to Server Components. Only add `"use client"` when the component
uses hooks, browser APIs, or event handlers.
```tsx
// ✅ Needs "use client"
"use client";
export function FilterPanel() { const [open, setOpen] = useState(false); ... }
// ✅ No directive — pure render
export function PropertyAddress({ address }: { address: Address }) { ... }
```
### Use the design-system components from `common/` — do not reinvent
| Need | Component |
|---|---|
| Button | `<Button variant="primary|secondary|ghost|danger">` |
| Text input | `<Input label="…" error="…">` |
| Modal | `<Modal isOpen={…} onClose={…}>` |
| Toast | `useToast()` → `showSuccess()` / `showError()` |
| Image | `<Visual src={…} alt={…}>` (wraps Next.js Image) |
| Role check | `<RoleGuard role="landlord">` |
| Loading | `<Loader size="sm|md|lg">` |
| Skeleton | `<PropertyListSkeleton>` |
| Map | `<MapView>` |
### Lazy-load heavy components
```tsx
// ✅
const PropertyForm = dynamic(
  () => import("@/components/PropertyForm").then(m => ({ default: m.PropertyForm })),
  { loading: () => <Loader />, ssr: false }
);
// ❌ — lands in the initial bundle
import { PropertyForm } from "@/components/PropertyForm";
```
The `AppShell` already lazy-loads `PropertyForm` and `AuthModal` (~200 KB saved).
### Props interface naming
```tsx
interface PropertyCardProps {
  property: Property & { units?: Unit[] };
  showEditButton?: boolean;
}
export function PropertyCard({ property, showEditButton = false }: PropertyCardProps) { ... }
```
### Accessibility requirements
Every interactive element needs an accessible label. Every form control needs an
associated `<label>`. Modals use `<Modal>` which handles focus-trapping automatically.
```tsx
// ✅
<button aria-label="Remove from liked list"><Icon name="heart" /></button>
<Visual src={url} alt={`${property.title} — main photo`} />
<Input id="search" label="Search properties" />
```
---
## 4. Data Fetching Standards
### Decision tree
```
Mutation (create / update / delete)?
  → API route + useMutation hook
Read in a client component?
  → useQuery / useInfiniteQuery from src/lib/hooks/
Read in a server component or API route?
  → createClient() + getSession() from lib/supabase/server.ts
```
### Import hooks from the barrel — never the individual file
```ts
// ✅
import { useProperties, useSessionUser, useRoles } from "@/lib/hooks";
// ❌
import { useSessionUser } from "@/lib/hooks/auth";
```
### Always spread `CACHE_STRATEGIES` — no magic numbers
```ts
import { CACHE_STRATEGIES } from "@/lib/config/cache_config";
// ✅
useQuery({
  queryKey: propertyKeys.detail(id),
  queryFn: () => getPropertyById(id),
  ...CACHE_STRATEGIES.STATIC,
});
// ❌
useQuery({ ..., staleTime: 300000 });
```
| Strategy | staleTime | gcTime | Use for |
|---|---|---|---|
| `STATIC` | 5 min | 10 min | Listings, profiles |
| `DYNAMIC` | 1 min | 5 min | Applications, status |
| `USER_SPECIFIC` | 30 s | 5 min | Session, likes |
| `REALTIME` | 0 | 0 | Future live data |
### Define query key factories in the hook file
```ts
// ✅
export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (filters: ...) => [...propertyKeys.lists(), filters] as const,
  detail: (id: string) => [...propertyKeys.all, "detail", id] as const,
};
```
### Never write to Supabase directly from a client component
```ts
// ✅ — mutation goes through an API route
useMutation({
  mutationFn: async (data) => {
    const res = await fetch("/api/property", { method: "POST", body: ... });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
});
// ❌ — bypasses server-side auth
const supabase = createClient();
await supabase.from("properties").insert(data);
```
### Invalidate caches after every mutation
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
  queryClient.invalidateQueries({ queryKey: authKeys.sessionUser });
  showSuccess("Saved!");
},
```
---
## 5. Styling Standards
### Use design tokens — never raw hex values
```tsx
// ✅
className="bg-card text-foreground border border-border"
className="text-primary-500 hover:text-primary-600"
className="bg-surface-subtle rounded-[var(--radius-lg)]"
// ❌
style={{ color: "#3a7f79" }}
className="bg-white text-gray-900"
```
### Key tokens (defined in `globals.css`)
| Token | Purpose |
|---|---|
| `--background` | Page background |
| `--foreground` | Primary text |
| `--card` | Card surface |
| `--surface-subtle` | Off-white background |
| `--border` | Default border |
| `--primary-500` | Brand teal (CTA colour) |
| `--text-muted` | Secondary text |
| `--text-subtle` | Placeholder / tertiary |
| `--focus-ring` | Focus outline |
| `--overlay` | Modal backdrop |
### Mobile-first responsive classes
```tsx
// ✅ base = mobile, sm/md/lg = larger screens
className="px-3 py-2 sm:px-4 sm:py-3 lg:px-8"
className="flex-col sm:flex-row"
```
---
## 6. File & Folder Conventions
### Always use `@/` path alias
```ts
// ✅
import { useProperties } from "@/lib/hooks";
// ❌
import { useProperties } from "../../../../lib/hooks";
```
### Always import from barrel `index.ts` files
```ts
// ✅
import { Button, Input, Modal } from "@/components/common";
// ❌
import { Button } from "@/components/common/Button";
```
When you add a new component, add it to the barrel export.
### Co-locate feature-specific files
Hooks and types used only by one feature live next to that feature:
```
components/Properties/
  hooks/
    usePropertyFilters.ts   ← only used in Properties
  PropertyCard.tsx
  PropertyList.tsx
  index.ts
```
Promote to `src/lib/hooks/` or `src/types/` only when multiple features need the same
thing.
### Database SQL goes in `database/`
| Change | Folder |
|---|---|
| New table | `database/tables/` |
| New index | `database/indexes/` |
| RLS policy | `database/policies/` |
| Function / trigger | `database/functions/` |
| View | `database/views/` |
Always commit SQL changes alongside the TypeScript changes that depend on them.
---
## 7. API Route Standards
### Template for every handler
```ts
// src/app/api/example/route.ts
import { NextRequest } from "next/server";
import { createClient, requireAuthForApi } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import { MyInputSchema } from "@/lib/validators";
export async function POST(request: NextRequest) {
  try {
    // 1. Auth — throws 401 automatically if not authenticated
    const user = await requireAuthForApi();
    // 2. Parse + validate with Zod
    const body = await request.json();
    const parsed = MyInputSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error: " + parsed.error.message, 400);
    }
    // 3. Authorise role if needed
    if (user.role !== "landlord") return errorResponse("Forbidden", 403);
    // 4. Business logic
    const supabase = await createClient();
    const { data, error } = await supabase.from("...").insert({ ... });
    if (error) {
      console.error("[POST /api/example] DB error:", error); // full detail server-side
      return errorResponse("Failed to save", 500);           // sanitised for client
    }
    // 5. Return
    return successResponse(data, 201);
  } catch (error) {
    throw error; // let requireAuthForApi() 401/403 responses bubble through
  }
}
```
### Validate all inputs with Zod
```ts
// ✅
const parsed = EnquiryRequestSchema.safeParse(body);
if (!parsed.success) return errorResponse("Invalid input", 400);
const { unit_id, message } = parsed.data;
// ❌ — raw unvalidated input
const { unit_id, message } = body;
```
### Never forward DB error messages to the client
```ts
// ✅
console.error("[route] DB error:", error);
return errorResponse("Failed to create property", 500);
// ❌ — may leak schema details
return errorResponse(error.message, 500);
```
---
## 8. Authentication & Authorisation
### Never trust client-provided user IDs
```ts
// ✅ — server derives identity from validated JWT
const user = await requireAuthForApi();
await supabase.from("properties").insert({ created_by: user.id });
// ❌ — attacker can forge this
const { userId } = await request.json();
await supabase.from("properties").insert({ created_by: userId });
```
### Use `requireAuthForApi()` on every authenticated route
```ts
// lib/supabase/server.ts exports:
requireAuthForApi()  // throws 401 NextResponse if no valid session
getSession()         // returns SessionUser | null (for optional auth)
```
### Use `useRoles()` in components — never compare roles manually
```tsx
// ✅
const { canManageProperties, hasRoleLevel, role } = useRoles();
// ❌
const { data: user } = useSessionUser();
if (user?.role === "landlord" || user?.role === "admin") { ... }
```
Available from `useRoles()`:
| Helper | Description |
|---|---|
| `role` | Current role string or null |
| `hasRole("landlord")` | Exact match |
| `hasAnyRole(["landlord","admin"])` | Any of the listed roles |
| `hasRoleLevel("landlord")` | landlord or higher privilege |
| `canManageProperties` | Shorthand: landlord+ |
| `canManageUsers` | Shorthand: admin+ |
### Use `<RoleGuard>` for conditional rendering
```tsx
// ✅
<RoleGuard role="landlord"><AddPropertyButton /></RoleGuard>
// ❌
{user?.role === "landlord" ? <AddPropertyButton /> : null}
```
---
## 9. State Management
### Decision tree
```
Comes from server / Supabase?     → TanStack Query
Shared across unrelated parts?    → React Context
Lives in the URL (filters/tabs)?  → nuqs useQueryState
Local to one component?           → useState / useReducer
```
### Do not add Zustand, Redux, or Jotai
TanStack Query already handles server state. `useState` handles local UI state. React
Context handles the small set of global UI state (auth modal, toast queue). Adding a
client store would be over-engineering.
### URL state with nuqs
For anything that should survive a refresh or be shareable:
```ts
import { useQueryState } from "nuqs";
const [search, setSearch] = useQueryState("q", { defaultValue: "" });
const [listingType, setListingType] = useQueryState("type");
```
### Use `useTransition` for low-priority updates
```tsx
const [isPending, startTransition] = useTransition();
const handleFilterChange = (value: string) => {
  setInputValue(value);            // immediate — high priority
  startTransition(() => {
    setDebouncedFilter(value);     // deferred — low priority
  });
};
```
---
## 10. Error Handling
### Add `<ErrorBoundary>` around feature sections
The root layout already has a top-level boundary. Add granular ones around individual
features so a broken widget doesn't blank the entire page:
```tsx
import { ErrorBoundary } from "@/components/common";
<ErrorBoundary fallback={<p>Failed to load applications.</p>}>
  <ApplicationList />
</ErrorBoundary>
```
### Always handle loading + error states
```tsx
const { data, isLoading, isError } = useProperties(filters);
if (isLoading) return <PropertyListSkeleton />;
if (isError)   return <Alert variant="error" message="Failed to load properties" />;
if (!data?.pages[0]?.data.length) return <EmptyState message={emptyMessage} />;
```
### Use `showToast` for mutation feedback
```ts
const { showSuccess, showError } = useToast();
useMutation({
  mutationFn: submitApplication,
  onSuccess: () => showSuccess("Application submitted!"),
  onError: (err) => showError(err.message ?? "Something went wrong"),
});
```
### Log with context before surfacing errors
```ts
// ✅
console.error("[useSubmitApplication] Failed:", error, { applicationId });
// ❌
console.error(error);
```
---
## 11. Testing Standards
### Testing pyramid
```
Unit        src/lib/utils/, src/lib/validators/
Component   src/components/ (future — Vitest + Testing Library)
E2E         e2e/            Playwright smoke tests
```
### E2E test location and naming
All Playwright tests live in `e2e/`. Follow the existing pattern:
```ts
test("homepage loads and renders property listings", async ({ page }) => { ... });
test("auth flow: magic-link form accepts a valid email", async ({ page }) => { ... });
```
### Always mock external services
```ts
// ✅
await page.route("**/api/auth/otp", async (route) => {
  await route.fulfill({ status: 200, body: JSON.stringify({ message: "Magic link sent" }) });
});
```
### Unit test requirements for new utilities
Every new function in `src/lib/utils/` or `src/lib/validators/` must have tests covering:
- Happy path
- Null / empty inputs
- Boundary conditions
- Invalid inputs (for validators)
---
## 12. Git Conventions
### Branch names
```
feature/inspection-scheduling
fix/property-card-image-fallback
chore/update-supabase-types
docs/add-api-comments
```
### Commit messages — Conventional Commits
```
feat: add inspection scheduling UI
fix: property card image fallback when no images
chore: update Supabase generated types
refactor: extract usePropertyFilters hook
test: add unit tests for authorization helpers
```
Format: `<type>(<optional scope>): <description>`
Types: `feat` `fix` `chore` `docs` `refactor` `test` `perf` `ci`
### Before raising a PR
```bash
npm run typecheck   # zero TS errors
npm run lint        # zero lint errors
npm run build       # builds successfully
npm test            # all E2E smoke tests pass
```
Keep PRs focused — one feature or fix per PR. Split large features into logical steps
(schema → API → UI).
---
## 13. Quick Reference — Do & Don''t
### Data & API
| ✅ Do | ❌ Don''t |
|---|---|
| `requireAuthForApi()` on every authenticated route | Trust `userId` from request body |
| Validate all inputs with a Zod schema | Accept raw unvalidated JSON |
| `console.error(...)` full DB error server-side, sanitised message to client | Forward `error.message` to the client |
| Call Supabase in `src/lib/queries/` called by hooks | Call `supabase.from()` inside a React component |
| Spread `CACHE_STRATEGIES.*` into `useQuery` | Hardcode `staleTime` numbers |
| `queryClient.invalidateQueries(...)` after mutations | Rely on polling to refresh stale data |
### Components & Styling
| ✅ Do | ❌ Don''t |
|---|---|
| Use CSS tokens (`bg-card`, `text-foreground`, `border-border`) | Raw hex or hardcoded Tailwind greys |
| Use `<Button>`, `<Input>`, `<Modal>` from `common/` | Build one-off versions of existing primitives |
| `"use client"` only when needed | Add it to every component by default |
| Lazy-load heavy modals + forms with `next/dynamic` | Import large components at module level |
| `<RoleGuard role="landlord">` for conditional rendering | Inline role string comparisons |
| `aria-label` on icon-only buttons; `alt` on images | Leave interactive elements without labels |
### TypeScript
| ✅ Do | ❌ Don''t |
|---|---|
| Import from `@/types/db.ts` for DB shapes | Re-declare table types by hand |
| `import type` for TypeScript types | Import types as values |
| `interface` for object shapes | `any` for unknown data |
### State
| ✅ Do | ❌ Don''t |
|---|---|
| `nuqs` for URL-persisted filter / tab state | `useState` for shareable state |
| React Context for global UI (modals, toasts) | Add Zustand / Redux / Jotai |
| All writes through `/api/` routes | Write to Supabase from client components |
