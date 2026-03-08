# Recommended Libraries — reKro

> Audit date: March 2026 · These are concrete additions that solve real gaps in the current codebase.

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

**Solves:** No visibility into bundle composition.

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

### 1.3 Form state management — `@conform-to/react` + `@conform-to/zod`

**Solves:** Forms currently manage their own state with `useState` + manual Zod parsing.
Conform provides progressive-enhancement-friendly forms that work with Server Actions and
re-use the existing Zod schemas.

```bash
npm install @conform-to/react @conform-to/zod
```

**Why over react-hook-form:** Works with React 19 Server Actions natively; zero-
dependency; built for progressive enhancement.

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

### 2.2 Type-safe environment variables — `@t3-oss/env-nextjs`

**Solves:** `process.env.NEXT_PUBLIC_SUPABASE_URL!` used with non-null assertion throughout
the codebase. Missing env vars cause silent runtime failures.

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
  },
  runtimeEnv: process.env,
});
```

Build fails fast if any variable is missing — no surprises in production.

---

### 2.3 Optimistic updates helper — already available in TanStack Query v5

**Solves:** Like/unlike actions and application status changes feel slow because they wait
for the server. TanStack Query v5's `optimisticUpdate` pattern is already available.

No new package needed — implement the pattern in existing hooks:

```ts
useMutation({
  mutationFn: toggleLike,
  onMutate: async (unitId) => {
    await queryClient.cancelQueries({ queryKey: propertyKeys.lists() });
    const previous = queryClient.getQueryData(propertyKeys.lists());
    // Optimistically update the cache
    queryClient.setQueryData(propertyKeys.lists(), (old) => toggleLikeInCache(old, unitId));
    return { previous };
  },
  onError: (_err, _unitId, context) => {
    queryClient.setQueryData(propertyKeys.lists(), context?.previous);
  },
});
```

---

### 2.4 Accessible date picker — `react-aria` / `@internationalized/date`

**Solves:** The application and inspection forms need date pickers. Plain `<input type="date">`
is inconsistently styled and inaccessible across browsers.

```bash
npm install react-aria @internationalized/date
```

**Why:** Adobe's React Aria provides fully accessible, unstyled date/time pickers that
integrate with TailwindCSS and match the existing design system approach.

---

### 2.5 Schema-driven PDF generation — `@react-pdf/renderer`

**Solves:** `jspdf` (~400 KB) is a low-level imperative API. React-PDF allows writing
PDF layouts as React components, which is more maintainable and produces smaller bundles
when lazy-loaded.

```bash
npm install @react-pdf/renderer
```

```tsx
import { Document, Page, Text } from "@react-pdf/renderer";

const ApplicationPDF = ({ application }) => (
  <Document>
    <Page><Text>{application.id}</Text></Page>
  </Document>
);
```

Lazy-load with `dynamic(() => import("./ApplicationPDF"), { ssr: false })`.

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

### 3.3 Feature flags — `@vercel/flags` or `growthbook`

**When:** Rolling out features to specific user segments (landlords only, beta users, etc.)

```bash
npm install @vercel/flags
```

Integrates with Vercel's edge config for zero-latency flag evaluation.

---

### 3.4 Analytics — `@vercel/analytics` + `@vercel/speed-insights`

**When:** You need user behaviour data and real-user performance metrics.

```bash
npm install @vercel/analytics @vercel/speed-insights
```

```tsx
// src/app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Add to RootLayout:
<Analytics />
<SpeedInsights />
```

Privacy-friendly, no cookie consent required for basic analytics.

---

### 3.5 Testing — `vitest` + `@testing-library/react`

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
| `redux` / `zustand` / `jotai` | TanStack Query already handles server state; `useState` handles the rest. Adding a global store would be over-engineering. |
| `react-hook-form` | Conform is lighter and works with Server Actions; RHF adds ~25 KB. |
| `moment.js` | `date-fns` (already installed) is tree-shakeable and modern. |
| `lodash` | Use native ES2022+ methods. Import specific functions only if absolutely needed. |
| `axios` | `fetch` (native) is sufficient for the current API surface. |
| `i18next` | Premature — add only when internationalisation is a confirmed requirement. |

