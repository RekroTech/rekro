# Scalability Analysis — reKro

> Audit date: March 2026 · Stack: Next.js 16 / React 19 / Supabase / TanStack Query v5

---

## 1. Current Architecture Overview

```
Browser (React 19)
    │
    ├── TanStack Query (client cache)
    │       ├── Infinite scroll property listings
    │       ├── Session user (5 min stale)
    │       └── Property detail prefetch on hover
    │
    ├── Next.js 16 App Router (Edge + Node runtimes)
    │       ├── /api/property       — POST (create), PATCH (update)
    │       ├── /api/enquiries      — POST
    │       ├── /api/application    — POST, PATCH
    │       └── /api/auth/otp       — POST
    │
    └── Supabase (PostgreSQL + Auth + Storage + Realtime)
            ├── Row Level Security (policies TBD)
            ├── PostGIS-ready geospatial indexes
            └── Storage (property images, documents)
```

---

## 2. What Scales Well Today

| Concern | Why it scales |
|---|---|
| **Stateless API routes** | Next.js API routes are serverless — auto-scales to demand |
| **Supabase connection pooling** | `@supabase/ssr` uses the pooler by default on Supabase cloud |
| **Pagination** | Properties use cursor-based infinite scroll (limit/offset) |
| **Database indexes** | B-tree indexes on `user_id`, `property_id`, `status`, price, availability; GIN on JSONB |
| **Image CDN** | Supabase Storage serves images via a CDN; Next.js Image further optimises them |
| **Client-side cache** | TanStack Query deduplicates in-flight requests; avoids redundant DB hits |
| **Role hierarchy** | RBAC is table-driven — adding new roles requires only a DB enum change |

---

## 3. Scalability Bottlenecks & Solutions

### 3.1 Offset-based pagination does not scale beyond ~100 k rows

**Problem:** `getProperties()` uses `.range(offset, offset + limit - 1)` which translates
to `OFFSET n` in SQL. At large offsets PostgreSQL must scan and discard all prior rows.

**Fix:** Switch to keyset (cursor) pagination using `created_at` + `id`:

```ts
// Cursor = { created_at: string, id: string } (base64-encoded)
let query = supabase
  .from("properties")
  .select("*")
  .order("created_at", { ascending: false })
  .order("id", { ascending: false })
  .limit(limit);

if (cursor) {
  const { created_at, id } = decodeCursor(cursor);
  query = query.or(`created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`);
}
```

---

### 3.2 Full-text search runs `ILIKE` on the database

**Problem:** The `search` filter in `property.queries.ts` likely uses `ilike` or string
matching. At scale this degrades to a full table scan.

**Fix:** Enable PostgreSQL full-text search (built into Supabase):

```sql
-- Add a generated tsvector column
ALTER TABLE properties
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
) STORED;

CREATE INDEX properties_search_idx ON properties USING GIN(search_vector);
```

Then query with `.textSearch('search_vector', query)`.

For advanced search, consider **Supabase pgvector** or a dedicated search service like
**Algolia** or **Meilisearch**.

---

### 3.3 No background job / queue system

**Problem:** Email sending (via Resend) is done synchronously inside API route handlers.
If Resend is slow or fails, the user waits or gets an error. Email failures also block the
transaction success response.

**Fix:** Decouple email from the request cycle:

- **Supabase Edge Functions** triggered by database webhooks
- **Inngest** (event-driven background jobs, works with Next.js)
- **Trigger.dev** (type-safe background jobs)

```ts
// Instead of awaiting email in the route:
await sendEnquiryNotification(enquiry);

// Fire-and-forget or queue:
await inngest.send({ name: "enquiry.created", data: { enquiryId } });
```

---

### 3.4 No read replica / caching layer for high-traffic reads

**Problem:** All reads hit the primary Supabase database. Property listings are public and
could benefit from a caching layer.

**Fix options:**

| Option | Complexity | Latency reduction |
|---|---|---|
| Next.js `revalidate` on server fetches | Low | ~40% |
| Vercel KV (Redis) cache for popular listings | Medium | ~70% |
| Supabase read replicas (paid plan) | Low | ~50% |
| Edge-side caching with `stale-while-revalidate` | Low | ~60% |

Recommended first step: move property list fetching to a Server Component with
`revalidate = 60` (1-minute ISR):

```ts
// Fetch on server, cache for 60 seconds
export const revalidate = 60;
```

---

### 3.5 Supabase Realtime not yet utilised

**Problem:** Listing status changes, application status updates, and new enquiries require
a page refresh to see.

**Fix:** Subscribe to Supabase Realtime channels for live updates:

```ts
const channel = supabase
  .channel("application-updates")
  .on("postgres_changes", {
    event: "UPDATE",
    schema: "public",
    table: "applications",
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  })
  .subscribe();
```

---

### 3.6 No multi-region strategy

**Problem:** Supabase project is in a single region. Users far from the database will
experience high latency.

**Fix (future):**
1. Deploy Next.js to Vercel Edge Network (global CDN already active)
2. Use Supabase read replicas for geographically distributed reads
3. Store static assets (images) in a CDN with multiple PoPs (Supabase Storage does this)

---

## 4. Database Scalability Checklist

- [x] B-tree indexes on all foreign keys and frequently filtered columns
- [x] GIN index on `address` JSONB
- [x] Geospatial indexes (lat/lng composite, location GIN)
- [ ] Full-text search index on `properties.title` + `description`
- [ ] Composite index on `(is_published, created_at)` for the default listing query
- [ ] Partial index on `units (is_available, available_from)` WHERE `is_active = true`
- [ ] `pg_stat_statements` enabled in Supabase for slow query identification
- [ ] Supabase connection pooling (PgBouncer) configured for > 50 concurrent users

---

## 5. Infrastructure Scaling Roadmap

| Users (MAU) | Recommended infra |
|---|---|
| 0 – 10 k | Current setup (Supabase free/pro + Vercel hobby/pro) |
| 10 k – 100 k | Supabase Pro + read replica, Vercel Pro, Upstash Redis cache |
| 100 k – 1 M | Supabase Enterprise or self-hosted Postgres, CDN for API responses, background job queue |
| 1 M+ | Dedicated Postgres cluster, microservices for search/notifications, global edge deployment |

