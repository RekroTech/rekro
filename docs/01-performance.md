# Performance Analysis — reKro

> Audit date: March 2026 (updated) · Stack: Next.js 16 / React 19 / Supabase / TanStack Query v5

---

## 1. Current Strengths

| Area | What's already in place |
|---|---|
| **Code splitting** | `dynamic()` for `PropertyForm` and `AuthModal` (~200 KB saved on initial bundle) |
| **React Compiler** | `reactCompiler: true` in `next.config.ts` — auto-memoises components & hooks |
| **Image optimisation** | AVIF + WebP formats, 30-day `minimumCacheTTL`, full `deviceSizes` ladder |
| **Turbopack** | Used by default in Next.js 16 for both dev and production builds |
| **CSS optimisation** | `optimizeCss: true` + `critters` for critical-CSS inlining |
| **Package imports** | `optimizePackageImports` for `@tanstack/react-query` and `@supabase/supabase-js` |
| **N+1 prevention** | Properties and units fetched in a single Supabase query with `units!inner()` |
| **Bulk likes** | `getBulkUnitLikes()` fetches all likes in one `.in()` call, not per-card |
| **Infinite scroll** | `IntersectionObserver` with `rootMargin: "200px"` pre-fetches the next page |
| **Prefetch on hover** | `usePrefetchProperty()` warms the property detail query on mouse-enter |
| **TanStack Query caching** | `staleTime: 5 min`, `gcTime: 10 min`, `refetchOnMount: false` for session |
| **Compression** | `compress: true` in Next.js config (Gzip/Brotli responses) |
| **React `cache()`** | `getSession()` is wrapped in React's `cache()` — one DB call per server request |
| **LCP image priority** | `PropertyList` passes `priority={index === 0}` to the first `PropertyCard` ✅ |
| **jsPDF lazy-loaded** | `pdfGenerator.ts` uses `await import("jspdf")` — excluded from initial bundle ✅ |

---

## 2. Performance Issues & Fixes

### ~~2.1 Client-side auth guard (authenticated layout)~~ ✅ RESOLVED

**Problem:** `src/app/(authenticated)/layout.tsx` was a Client Component that called
`useSessionUser()` on every render and redirected with `redirect()` inside a `useEffect`.
This caused a flash of blank content before the redirect fired.

**Fix:** Converted to a Server Component using `getSession()`.

```tsx
// src/app/(authenticated)/layout.tsx  — SERVER component
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { AuthenticatedClientWrapper } from "./AuthenticatedClientWrapper";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/?auth=open");
  return <AuthenticatedClientWrapper>{children}</AuthenticatedClientWrapper>;
}
```

**Impact:** Eliminates the loading spinner flash; route protection happens at the server before any client code runs. ✅

---

### 2.2 `force-dynamic` on the home page ⚠️ Still open

**Problem:** `export const dynamic = "force-dynamic"` in `src/app/page.tsx` disables all
caching for the page, meaning every visitor hits the origin server for every request.

**Fix:** Move property fetching to a Server Component with `revalidate`, or use React
Query on the client (which is already in place) and remove the `force-dynamic` directive.
Client components that fetch their own data do not need the parent page to be dynamic.

```tsx
// Remove this line from page.tsx:
// export const dynamic = "force-dynamic";
```

**Impact:** Allows the page shell to be statically cached at the CDN edge, reducing TTFB
for every visitor.

---

### 2.3 Missing `Suspense` boundaries around async data ⚠️ Still open

**Problem:** Slow data-fetching components block the entire page render rather than
streaming in progressively.

**Fix:** Wrap `PropertyList` and other heavy components in `<Suspense>`.

```tsx
<Suspense fallback={<PropertyListSkeleton />}>
  <PropertyList {...filters} />
</Suspense>
```

---

### 2.4 No font subsetting beyond Latin ⚠️ Still open

**Problem:** The Geist fonts load the full `latin` subset even on pages that may only need
ASCII.

**Fix:** Add `preload: true` and review if `latin-ext` is needed.

---

### ~~2.5 `jspdf` is not lazily loaded~~ ✅ RESOLVED

`pdfGenerator.ts` already uses `await import("jspdf")` inside the async `generateApplicationPDF`
function. jsPDF is excluded from the initial bundle and only loaded when a PDF is actually
generated on the application snapshot page.

---

### 2.6 Sentry `tracesSampleRate: 1` in production ⚠️ Still open

**Problem:** Sampling 100 % of traces adds ~15–30 ms of overhead per request in
production and generates significant Sentry bill volume. All three Sentry config files
(`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) still
have `tracesSampleRate: 1`.

**Fix:**

```ts
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
```

---

### 2.7 Google Maps API loaded globally ⚠️ Still open

**Problem:** `@react-google-maps/api` loads the Maps JS SDK for every page, even pages
that contain no map. The `PropertyMapView` component (now used on the home page map
toggle) should only load the SDK when the map tab is active.

**Fix:** The `<LoadScript>` provider is already scoped inside `PropertyMapView`. Ensure
`PropertyMapView` itself is conditionally rendered (only when `viewMode === "map"`) so
that the SDK is never loaded in the default grid view.

---

## 3. Metrics Targets

| Metric | Target | Notes |
|---|---|---|
| LCP | < 2.5 s | First `PropertyCard` image is eager-loaded via `priority={true}` ✅ |
| INP | < 200 ms | React Compiler + `useTransition` already in place |
| CLS | < 0.1 | Reserve image dimensions with aspect-ratio CSS |
| TTFB | < 600 ms | Remove `force-dynamic`; use ISR/edge caching |
| Bundle (initial JS) | < 150 KB gzip | Audit with `@next/bundle-analyzer` |

---

## 4. Quick Wins Checklist

- [x] Add `priority` prop to the first visible `<Visual>` / `<Image>` in `PropertyCard` — **done** (`PropertyList` passes `priority={index === 0}`)
- [x] jsPDF lazily imported in `pdfGenerator.ts` via `await import("jspdf")` — **done**
- [ ] Add `fetchpriority="high"` to the hero image
- [x] Remove `force-dynamic` from `src/app/page.tsx` — **done** ✅
- [x] Convert `(authenticated)/layout.tsx` to a Server Component — **done** ✅
- [ ] Add `<Suspense>` wrappers around `PropertyList` and heavy async components
- [ ] Set `loading="lazy"` on below-fold property card images (Next.js Image does this by default below the fold)
- [x] Replace `Math.random()` toast IDs with `crypto.randomUUID()` — **done** ✅
- [ ] Enable `ppr: "incremental"` (Partial Prerendering) once stable in Next.js 16
- [x] Add `<link rel="preconnect">` for Supabase and Google Maps domains in `layout.tsx` — **done** ✅
- [ ] Run `npx @next/bundle-analyzer` and address any unexpected large chunks
- [x] Lower `tracesSampleRate` to `0.1` in production across all three Sentry configs — **done** ✅
