# Scalability Analysis — reKro

> Audit date: March 29, 2026 · Stack: Next.js 16 / React 19 / Supabase / TanStack Query v5

---

## 1. Current Architecture Overview

```text
Browser (React 19)
    │
    ├── TanStack Query (client cache)
    │       ├── Infinite property listings (offset pagination, limit 12)
    │       ├── Session user cache
    │       ├── Profile / application / property detail queries
    │       └── Prefetch-on-hover for property detail
    │
    ├── Next.js 16 App Router
    │       ├── /api/auth/otp                         POST
    │       ├── /api/auth/callback                    GET
    │       ├── /api/enquiries                        POST
    │       ├── /api/property                         POST
    │       ├── /api/property/[id]                    PATCH / DELETE
    │       ├── /api/property/[id]/media              PATCH
    │       ├── /api/application                      POST
    │       ├── /api/application/submit               POST
    │       ├── /api/application/status               PATCH
    │       ├── /api/application/withdraw             POST
    │       ├── /api/application/snapshot             POST
    │       ├── /api/user/profile                     GET / PATCH
    │       ├── /api/user/phone-verification/send     POST
    │       ├── /api/user/phone-verification/verify   POST
    │       └── /api/voiceflow/properties/search      GET
    │
    └── Supabase (PostgreSQL + Auth + Storage)
            ├── Row Level Security (partially evidenced in repo)
            ├── Storage buckets for property media
            ├── JSONB-heavy schema for address / documents / amenities
            └── Geospatial indexing support in `database/indexes/`
```

---

## 2. What Scales Well Today

| Concern | Why it scales reasonably well now |
|---|---|
| **Stateless route handlers** | Next.js route handlers remain horizontally scalable on serverless infrastructure |
| **Client caching** | TanStack Query deduplicates requests and keeps hot data in memory |
| **Infinite scroll** | Listing pages fetch only 12 records at a time |
| **Database indexing** | Repo includes indexes for geospatial data and common relational filters |
| **Bulk likes lookup** | `getBulkUnitLikes()` avoids per-card queries by batching with `.in()` |
| **Per-request auth caching** | `getSession()` uses React `cache()` on the server |
| **Conditional maps loading** | Maps UI mounts only in map view, avoiding default-page SDK cost |
| **jsPDF lazy loading** | PDF generation code does not inflate the initial bundle |
| **App-side abuse limits** | OTP, enquiry, and property create endpoints now have app-level rate limiting |
| **CDN-friendly shell** | Home page no longer forces dynamic rendering for the top-level shell |

---

## 3. Scalability Bottlenecks & Recommended Changes

### 3.1 Offset pagination will degrade at large listing volumes

**Current state:** property listing queries still use offset/range-based pagination.

**Why it matters:** PostgreSQL must scan and skip earlier rows for deep pages, which becomes increasingly expensive as listing count grows.

**Recommended fix:** switch high-traffic public listings to keyset pagination using a stable sort such as `created_at DESC, id DESC`.

```ts
// Cursor example: { created_at, id }
let query = supabase
  .from("properties")
  .select("*")
  .order("created_at", { ascending: false })
  .order("id", { ascending: false })
  .limit(limit);
```

---

### 3.2 Search still relies on `ILIKE`-style filtering

**Current state:** listing search uses tokenized string matching / `ilike` patterns against title, description, and address fields.

**Why it matters:** this works at MVP scale, but becomes expensive and harder to tune when listings grow significantly.

**Recommended fix:** add PostgreSQL full-text search to `properties` (and possibly `units`) with a generated `tsvector` and GIN index.

```sql
ALTER TABLE properties
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
) STORED;

CREATE INDEX properties_search_idx ON properties USING GIN(search_vector);
```

---

### 3.3 Email sending is still synchronous in request handlers

**Current state:** `/api/enquiries` sends emails in the request lifecycle. Similar patterns are used elsewhere for transactional notifications.

**Why it matters:** slow email-provider responses increase request latency and can cause user-facing success paths to feel slower than necessary.

**Recommended fix:** move notification work to background execution.

Good fit options:
- **Inngest** for durable background jobs on Vercel / Next.js
- Supabase-triggered functions or webhooks
- Trigger.dev if more workflow orchestration is needed

---

### 3.4 Realtime is not yet used for high-value live updates

**Current state:** application status changes and similar updates still rely on refetch / manual refresh patterns.

**Why it matters:** users expect live updates for application workflows, messaging, and inspections.

**Recommended fix:** adopt Supabase Realtime for:
- application status updates
- inspection slot booking changes
- future messaging / notification features

---

### 3.5 Public reads still depend mostly on the primary database

**Current state:** property list and property search paths are primarily backed by direct database reads plus client caching.

**Why it matters:** once traffic increases materially, public browse traffic can dominate the primary DB workload.

**Recommended next step:** introduce one of the following in order of simplicity:
1. short-lived server caching / `revalidate` for public list shells
2. Redis/KV cache for popular listing queries
3. Supabase read replicas when traffic justifies it

---

### 3.6 No formal multi-region data strategy yet

**Current state:** the repo gives no evidence of multi-region database topology.

**Impact:** global CDN helps static assets and page shells, but DB latency remains region-bound.

**Future path:**
- keep static content and assets edge-friendly
- add read replicas for geographically distant audiences
- evaluate search/cache offload before full multi-region database complexity

---

## 4. Database Scalability Checklist

- [x] API surface is mostly stateless and serverless-friendly
- [x] Query layer avoids obvious N+1 problems in property listings
- [x] Geospatial/index SQL exists in `database/indexes/`
- [ ] Replace offset pagination with keyset pagination for very large datasets
- [ ] Add PostgreSQL full-text search indexes for listing search
- [ ] Move transactional email out of the request path
- [ ] Add slow-query observability (`pg_stat_statements` or equivalent runtime monitoring)
- [ ] Document/verify connection-pooling posture in deployed Supabase environment

---

## 5. Scaling Roadmap

| Stage | What to prioritize |
|---|---|
| 0 → 10k MAU | Current stack is fine; finish RLS baseline, tests, and background email |
| 10k → 100k MAU | Add Redis/KV caching, FTS, better observability, and background jobs |
| 100k → 1M MAU | Read replicas, more aggressive query optimization, live updates, dedicated search |
| 1M+ | Split search/notification concerns into dedicated services if needed |
