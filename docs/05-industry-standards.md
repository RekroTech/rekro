# Industry Standards & Best Practices — reKro

> Audit date: March 2026 (updated) · Measured against Next.js 16, React 19, and modern PropTech standards.

---

## 1. Code Quality

### 1.1 TypeScript usage ✅ Strong

- Strict TypeScript throughout (`"typescript": { "ignoreBuildErrors": false }`)
- Well-typed Supabase schema via generated `db.ts` types
- Zod v4 for runtime validation on all API endpoints
- `AppRole` enum-driven RBAC with typed role hierarchy
- `SessionUser` type shared between server and client

**Gaps:**
- `as unknown as` casts in both `src/lib/supabase/server.ts` and `src/lib/hooks/auth.ts`
  when extracting `user_roles` from the joined query result — worth fixing with a typed
  intermediate or a Supabase RPC that returns a flat row
- Confirm `"strict": true` is set in `tsconfig.json`

---

### 1.2 Linting & Formatting ✅ Good

- ESLint 9 with `eslint-config-next`
- Prettier configured (`.prettierrc`)

**Gaps:**
- No `eslint-plugin-jsx-a11y` for automated accessibility checking
- No `eslint-plugin-security` for security anti-patterns
- No Husky + lint-staged pre-commit hooks — style drift can creep in

**Recommended additions:**
```bash
npm install --save-dev eslint-plugin-jsx-a11y eslint-plugin-security husky lint-staged
```

---

### 1.3 Component Architecture ✅ Good

- Clear separation: `components/common` (design system), feature components, layout
- Co-located hooks in `components/Properties/hooks/`
- Context providers cleanly separated:
  - `AuthModalContext` — controls the global auth modal
  - `ToastContext` — toast notification queue
  - `ProfileCompletionContext` — wraps authenticated routes to track profile completeness
  - `DocumentOperationsContext` — document upload/download state for the application flow
- Barrel exports via `index.ts`
- Two hooks directories exist with distinct purposes:
  - `src/lib/hooks/` — TanStack Query hooks (data fetching, mutations)
  - `src/hooks/` — non-data utility hooks (`useDebounce`, `useMediaQuery`, `usePlacesAutocomplete`, `useRequireAuth`, `useToast`)

**Gaps:**
- No Storybook or component documentation — onboarding new developers is harder
- `PropertyCard.tsx` imports `PropertyForm` (edit modal) — tight coupling between a display component and a mutation component

---

### 1.4 Error Handling ✅ Good

- `ErrorBoundary` wraps the entire app tree in `layout.tsx`
- `global-error.tsx` for root-level errors
- Sentry capturing with source maps
- `errorResponse` / `successResponse` helpers for consistent API responses

**Gaps:**
- No error boundaries around individual route segments — a single broken widget can blank
  the whole page section
- API routes return `500` with database error messages that may leak schema information
  to clients

---

## 2. Testing Standards

### Current state

| Layer | Coverage | Tool |
|---|---|---|
| E2E — critical paths | 5 smoke tests | Playwright |
| Unit tests | ❌ None | — |
| Component tests | ❌ None | — |
| API integration tests | ❌ None | — |

### Industry standard for a production PropTech app

| Layer | Target coverage | Recommended tool |
|---|---|---|
| E2E | 10–20 critical flows | Playwright ✅ |
| Component | 60% of UI components | Vitest + Testing Library |
| Unit | 80% of utils/validators | Vitest |
| API | All route handlers | Vitest + MSW or Supertest |

### E2E gaps in existing smoke tests
- No test for property creation (landlord flow)
- No test for application submission
- No test for inspection request
- No test for profile completion
- No accessibility smoke test (axe-core)

---

## 3. Accessibility (A11y)

### Current state ✅ Good baseline

- `Skip to main content` link implemented in `AppShell.tsx`
- `role="main"` and `tabIndex={-1}` on the main content area
- `id="main-content"` for landmark navigation
- `sr-only` for visually hidden headings
- `focus-trap-react` for modal focus management
- `aria-label` on search input
- `PropertyList` emits a `role="status" aria-live="polite"` announcement when the property count changes ✅

### Gaps

| Issue | WCAG level | Fix |
|---|---|---|
| No `aria-live` regions for toast notifications | AA | Add `role="status"` or `aria-live="polite"` to `ToastProvider` |
| No loading state announcements | AA | Add `aria-busy="true"` during data fetching |
| Property card images may lack descriptive `alt` text | A | Audit `<Visual>` usage across `PropertyCard` and `PropertyMapCard` |
| Colour contrast not audited | AA | Run Lighthouse accessibility audit |
| Image gallery (Embla Carousel) keyboard navigation | A | Verify arrow-key and focus behaviour in `ImageGallery` |
| Missing `<label>` associations in some filters | A | Audit all form controls in `FilterDropdown` |

---

## 4. API Design Standards

### Current state ✅ REST-ish

- Consistent `errorResponse` / `successResponse` helpers
- Proper HTTP status codes (400, 401, 403, 500)
- Zod validation on all inputs
- `no-store` cache headers on API routes

### Gaps

| Issue | Recommendation |
|---|---|
| No API versioning | Add `/api/v1/` prefix before going public |
| Inconsistent error shape | Standardise to `{ error: { code, message, details } }` |
| No OpenAPI / Swagger spec | Add `zod-to-openapi` to auto-generate from existing Zod schemas |
| No request ID header | Add `X-Request-ID` for distributed tracing |

---

## 5. Git & CI/CD Standards

### Current state
- `.github/` directory exists (workflows not reviewed)
- Sentry source map upload configured for CI

### Industry standard checklist

- [ ] Branch protection on `main` — require PR + passing CI
- [ ] Automated `npm audit` in CI pipeline
- [ ] TypeScript check (`tsc --noEmit`) in CI
- [ ] ESLint in CI
- [ ] Playwright smoke tests in CI (on preview deployments)
- [ ] Conventional commits (`feat:`, `fix:`, `chore:`)
- [ ] Automated changelog generation (e.g., `release-please`)
- [ ] Environment promotion: `dev` → `staging` → `production`
- [ ] Database migration tracking (e.g., Supabase CLI migrations)

---

## 6. Documentation Standards

### Current state
- `README.md` exists
- Inline JSDoc comments on key functions
- SQL files document table structure
- E2E test README

### Gaps
- No architecture decision records (ADRs)
- No onboarding guide for new developers
- No API documentation
- No database ER diagram
- No deployment runbook

**Recommended structure** (this `docs/` folder):
```
docs/
├── 01-performance.md       ← this audit
├── 02-security.md          ← this audit
├── 03-scalability.md       ← this audit
├── 04-libraries.md         ← this audit
├── 05-industry-standards.md ← this file
├── 06-suggested-features.md ← this audit
├── 07-production-readiness.md ← this audit
├── architecture/
│   ├── adr-001-supabase-ssr.md
│   └── er-diagram.md
└── runbooks/
    ├── deployment.md
    └── incident-response.md
```

---

## 7. Observability Standards

### Current state
- Sentry error tracking + tracing
- Sentry logs enabled (`enableLogs: true`)
- Vercel monitoring (assumed, via deployment platform)

### Gaps

| Missing | Recommended tool | Priority |
|---|---|---|
| Real User Monitoring (RUM) | `@vercel/speed-insights` | High |
| User analytics / funnels | `@vercel/analytics` | High |
| Uptime monitoring | Vercel / BetterStack | High |
| Structured logging | `pino` with JSON output | Medium |
| Database query performance | Supabase `pg_stat_statements` | Medium |
| Alerting rules | Sentry alerts + PagerDuty/Slack | Medium |

