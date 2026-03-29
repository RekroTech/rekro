# Recommended Libraries — reKro

> Audit date: March 29, 2026 · Repository-aligned recommendations only

---

## 1. Already Installed (do not re-add)

These libraries are already present in `package.json`.

| Package | Current use |
|---|---|
| `@react-email/components` + `@react-email/render` | Transactional email templates |
| `@react-google-maps/api` | Map view and Places Autocomplete |
| `@sentry/nextjs` | Error monitoring and tracing |
| `@supabase/ssr` + `@supabase/supabase-js` | Auth, database, storage |
| `@t3-oss/env-nextjs` | Typed environment validation via `src/env.ts` |
| `@tanstack/react-query` | Client-side async state and caching |
| `@tanstack/react-virtual` | Large-list virtualization support |
| `@upstash/ratelimit` + `@upstash/redis` | App-side rate limiting helper in `src/app/api/utils.ts` |
| `@vercel/analytics` + `@vercel/speed-insights` | Production analytics / RUM hooks in `src/app/layout.tsx` |
| `clsx` | Conditional class composition |
| `critters` | CSS optimization support |
| `date-fns` | Date formatting |
| `embla-carousel-react` + `embla-carousel-autoplay` | Property gallery carousel |
| `focus-trap-react` | Modal focus management |
| `jspdf` | PDF generation, already lazy-loaded |
| `libphonenumber-js` | Phone normalization / validation |
| `lucide-react` | Icons |
| `nuqs` | URL query state |
| `react-error-boundary` | Error boundaries |
| `react-intersection-observer` | Infinite-scroll trigger |
| `resend` | Transactional email delivery |
| `zod` | Runtime validation |
| `@next/bundle-analyzer` (dev) | Installed, but not yet wired into `next.config.ts` |

---

## 2. Best Additions for Current Gaps

### 2.1 Unit + component testing — `vitest` + Testing Library

**Why:** the biggest gap in the repo today is test coverage below the E2E level.

```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event
```

**Use it for:**
- Zod validators
- authorization helpers
- query-key factories and utility functions
- component rendering / form behavior

---

### 2.2 Accessibility automation — `@axe-core/playwright`

**Why:** the app has a decent baseline, but there are no explicit accessibility smoke tests in the repo.

```bash
npm install --save-dev @axe-core/playwright
```

**Use it for:**
- homepage smoke audit
- auth modal audit
- property detail page audit
- form/control regressions in CI

---

### 2.3 Background jobs — `inngest`

**Why:** email sending still happens inside request handlers such as `/api/enquiries`.

```bash
npm install inngest
```

**Good fit here:**
- enquiry notification emails
- future saved-search alerts
- inspection reminders
- application status notifications

---

### 2.4 Map clustering — `@googlemaps/markerclusterer`

**Why:** map view is already shipped; clustering is the natural next step once listing density rises.

```bash
npm install @googlemaps/markerclusterer
```

**Use it for:**
- dense city/suburb pin clusters
- reduced marker overdraw
- better mobile map usability

---

## 3. Useful Improvements Without New Libraries

### 3.1 Finish using `env` where practical

`@t3-oss/env-nextjs` is already installed and wired through `src/env.ts`.

Remaining direct `process.env` reads still exist in places such as:
- `src/lib/email/enquiries.tsx`
- `src/hooks/usePlacesAutocomplete.ts`
- `src/components/Properties/PropertyMapView.tsx`
- `src/components/Property/TravelTimeSummary.tsx`

No new package is needed — this is now a consistency cleanup task.

---

### 3.2 Wire up the installed bundle analyzer

`@next/bundle-analyzer` is already installed as a dev dependency, but not yet connected in `next.config.ts`.

No new install is needed. Just wire it into the existing Next config and run a build analysis.

---

### 3.3 Optimistic updates with TanStack Query v5

No new package is needed.

Best candidates in this app:
- likes / unlike flows
- profile updates
- application status UI feedback

---

## 4. Lower-Priority / Future Additions

### 4.1 Search service — Meilisearch or Algolia

Only consider this after:
1. PostgreSQL full-text search is implemented, and
2. real search scale / relevance issues appear.

---

### 4.2 Feature flags — `@vercel/flags`

Good fit when you begin rolling features out gradually (beta messaging, landlord-only tools, etc.).

---

### 4.3 Date/time primitives — `react-aria` / `@internationalized/date`

Worth adding when inspection scheduling and more advanced calendar/time input UIs are built.

---

## 5. What NOT to Add Right Now

| Library | Why to avoid it now |
|---|---|
| `redux`, `zustand`, `jotai` | Current state is already well split across TanStack Query, Context, and local state |
| `axios` | Native `fetch` is sufficient for the app’s current API surface |
| `react-hook-form` | Existing forms already work with controlled state + Zod; extra abstraction is not yet justified |
| `moment` | `date-fns` is already installed and is the better modern choice |
| `lodash` | Native modern JS covers the current use cases |
| `@react-pdf/renderer` | `jspdf` already covers the current PDF requirement |
| search SaaS immediately | Built-in PostgreSQL FTS should be the first upgrade path |
