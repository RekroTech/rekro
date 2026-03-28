# Recommended Libraries — reKro

> Audit date: March 2026 (updated) · These are concrete additions that solve real gaps in the current codebase.

---

## Already Installed (for reference)

These libraries are **already in `package.json`** — do not re-add them:

| Package | Purpose |
|---|---|
| `@react-email/components` + `@react-email/render` | Email template system (preview with `npm run email:preview`) |
| `@react-google-maps/api` | Map view (`PropertyMapView`) and Places Autocomplete search |
| `@sentry/nextjs` | Error monitoring + tracing |
| `@supabase/ssr` + `@supabase/supabase-js` | Database, auth, storage |
| `@tanstack/react-query` | Server-state caching and async data |
| `@tanstack/react-virtual` | Virtual scrolling for large lists |
| `clsx` | Conditional class names |
| `critters` | Critical CSS inlining |
| `date-fns` | Date formatting (tree-shakeable; **do not add `moment.js`**) |
| `embla-carousel-react` + `embla-carousel-autoplay` | Property image gallery carousel |
| `focus-trap-react` | Modal focus management |
| `jspdf` | PDF generation (already lazily imported via `await import("jspdf")`) |
| `libphonenumber-js` | Phone number parsing + E.164 normalisation |
| `lucide-react` | Icon library |
| `next` `react` `react-dom` | Framework core |
| `nuqs` | URL state management for filters and tabs |
| `react-error-boundary` | Error boundary component |
| `react-intersection-observer` | Infinite scroll trigger |
| `resend` | Transactional email |
| `zod` | Runtime input validation |

---

## Priority 1 — Address Immediately

### 1.1 Rate Limiting — `@upstash/ratelimit` + `@upstash/redis`

**Solves:** No rate limiting on `/api/enquiries`, `/api/auth/otp`, `/api/property` (see Security doc §2.2)

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Usage:**
```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```

**Pricing:** Free tier includes 10 k requests/day. No infrastructure to manage.

---

### 1.2 Bundle Analysis — `@next/bundle-analyzer`

**Solves:** No visibility into bundle composition. Install as a dev dependency.

```bash
npm install --save-dev @next/bundle-analyzer
```

```ts
// next.config.ts
import bundleAnalyzer from "@next/bundle-analyzer";
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
export default withBundleAnalyzer(withSentryConfig(nextConfig, sentryConfig));
```

```bash
ANALYZE=true npm run build
```

---

### 1.3 Type-safe environment variables — `@t3-oss/env-nextjs`

**Solves:** `process.env.NEXT_PUBLIC_SUPABASE_URL!` is used with non-null assertions
throughout the codebase (`server.ts`, `middleware.ts`). Missing env vars cause silent
runtime failures.

```bash
npm install @t3-oss/env-nextjs
```

```ts
// src/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
});
```

Build fails fast if any variable is missing — no surprises in production.

---

## Priority 2 — High Value, Low Risk

### 2.1 Background jobs — `inngest`

**Solves:** Email sending is synchronous in API handlers (see Scalability doc §3.3).

```bash
npm install inngest
```

**What it gives you:**
- Durable function execution (auto-retries on failure)
- Event-driven architecture (enquiry.created → send email → update DB)
- Works with Next.js API routes and Vercel
- Free tier: 50 k function runs/month

---

### 2.2 Optimistic updates — already available in TanStack Query v5

**Solves:** Like/unlike actions and application status changes feel slow because they wait
for the server.

No new package needed — implement the pattern in existing hooks:

```ts
useMutation({
  mutationFn: toggleLike,
  onMutate: async (unitId) => {
    await queryClient.cancelQueries({ queryKey: propertyKeys.lists() });
    const previous = queryClient.getQueryData(propertyKeys.lists());
    queryClient.setQueryData(propertyKeys.lists(), (old) => toggleLikeInCache(old, unitId));
    return { previous };
  },
  onError: (_err, _unitId, context) => {
    queryClient.setQueryData(propertyKeys.lists(), context?.previous);
  },
});
```

---

### 2.3 Accessible date picker — `react-aria` / `@internationalized/date`

**Solves:** The application and inspection forms need date pickers. Plain `<input type="date">`
is inconsistently styled and inaccessible across browsers.

```bash
npm install react-aria @internationalized/date
```

**Why:** Adobe's React Aria provides fully accessible, unstyled date/time pickers that
integrate with TailwindCSS and match the existing design system approach.

---

### 2.4 Analytics & Speed Insights — `@vercel/analytics` + `@vercel/speed-insights`

**Solves:** No user behaviour data or real-user performance metrics. Neither package is
currently installed.

```bash
npm install @vercel/analytics @vercel/speed-insights
```

```tsx
// src/app/layout.tsx — add inside RootLayout
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

<Analytics />
<SpeedInsights />
```

Privacy-friendly, no cookie consent required for basic analytics.

---

## Priority 3 — Future / Growth

### 3.1 Search — `meilisearch` (self-hosted) or `@algolia/client-search`

**When:** When the property database exceeds ~10 k listings and `ILIKE` queries degrade.

**Meilisearch** (recommended):
- Open source, can self-host on Fly.io for ~$5/month
- Typo-tolerant, faceted search, geosearch
- Official Supabase + Meilisearch sync pattern available

```bash
npm install meilisearch
```

---

### 3.2 Real-time notifications — Supabase Realtime (already bundled)

**When:** User base grows and polling becomes noticeable.

No new package needed — `@supabase/supabase-js` includes Realtime.
See Scalability doc §3.5 for implementation.

---

### 3.3 Feature flags — `@vercel/flags`

**When:** Rolling out features to specific user segments (landlords only, beta users, etc.)

```bash
npm install @vercel/flags
```

Integrates with Vercel's edge config for zero-latency flag evaluation.

---

### 3.4 Testing — `vitest` + `@testing-library/react`

**When:** Immediately — Playwright covers E2E but there are no unit/component tests.

```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event
```

Configure alongside Playwright for a complete testing pyramid:
- Unit: Zod validators, authorization helpers, utility functions
- Component: Form components, PropertyCard, AuthModal
- E2E: Existing Playwright smoke tests

---

## What NOT to Add

| Library | Reason to avoid |
|---|---|
| `redux` / `zustand` / `jotai` | TanStack Query already handles server state; `useState` handles the rest |
| `react-hook-form` | Existing forms use controlled state + Zod directly; RHF adds ~25 KB |
| `moment.js` | `date-fns` (already installed) is tree-shakeable and modern |
| `lodash` | Use native ES2022+ methods |
| `axios` | `fetch` (native) is sufficient for the current API surface |
| `i18next` | Premature — add `next-intl` only when internationalisation is a confirmed requirement |
| `@react-pdf/renderer` | jsPDF is already lazily imported — sufficient for the current PDF use case |
