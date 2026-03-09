# reKro

> A modern Australian rental platform — connect, find flatmates, and discover your next home.

reKro lets renters browse listings, submit applications, and connect with potential flatmates. Landlords can list properties, manage units, and review tenant applications — all in one place.

---

## Table of Contents

- [Stack](#️-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [Email Template Preview](#️-email-template-preview)
- [Project Structure](#-project-structure)
- [Route Map](#️-route-map)
- [Key Concepts](#-key-concepts)
- [Database](#️-database)
- [Testing](#-testing)
- [Scripts](#-scripts)
- [Further Reading](#-further-reading)

---

## 🏗️ Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16.1.5](https://nextjs.org) — App Router, React Server Components, Turbopack |
| UI | [React 19.2.3](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org) (strict) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + full CSS-variable design token system |
| Database / Auth | [Supabase](https://supabase.com) — Postgres, Row Level Security, Storage, SSR Auth |
| Client data | [TanStack Query v5](https://tanstack.com/query) — caching, infinite scroll, mutations |
| URL state | [nuqs v2](https://nuqs.47ng.com) — type-safe URL search params |
| Email | [Resend](https://resend.com) — transactional email (enquiries, confirmations) |
| Email templates | [React Email](https://react.dev/email) — JSX-based email templates with live preview server |
| Maps | [Google Maps / Places API](https://developers.google.com/maps) — geocoding + map display |
| Chatbot | [Voiceflow](https://www.voiceflow.com) — property search via `/api/voiceflow/properties/search` |
| PDF export | [jsPDF](https://github.com/parallax/jsPDF) — application PDF generation |
| Error tracking | [Sentry](https://sentry.io) — errors, tracing, session replay |
| Testing | [Playwright](https://playwright.dev) — E2E smoke tests |
| Bundler | Turbopack (Next.js 16 default) |
| Font | [Geist](https://vercel.com/font) sans + mono |

---

## ✅ Prerequisites

| Tool | Minimum version | Install |
|---|---|---|
| Node.js | 20 | [nodejs.org](https://nodejs.org) |
| npm | 10 | bundled with Node |
| Git | any | [git-scm.com](https://git-scm.com) |

You also need accounts / projects set up for:

- **Supabase** — [app.supabase.com](https://app.supabase.com) (free tier is fine locally)
- **Google Maps** — [console.cloud.google.com](https://console.cloud.google.com) (enable Maps JS API + Places API)
- **Resend** *(optional for local dev)* — [resend.com](https://resend.com)

---

## 📦 Installation

```bash
# 1. Clone
git clone <repo-url>
cd rekro

# 2. Install dependencies
npm install

# 3. Copy the env template
cp .env.example .env.local
```

Then fill in `.env.local` — see the next section.

---

## 🔑 Environment Variables

```env
# ── App ─────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Supabase ─────────────────────────────────────────────────────────
# Settings → API in your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# ── Google Maps ──────────────────────────────────────────────────────
# Enable: Maps JavaScript API + Places API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# ── Resend (email) ───────────────────────────────────────────────────
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
SEND_ENQUIRY_CONFIRMATION=true   # false = skip confirmation emails locally

# ── Sentry (optional locally) ────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
```

> **Supabase tip:** credentials are under **Settings → API**.
> The anon key is designed to be public — never commit the `service_role` key.

**Auth redirect URL** — in your Supabase dashboard go to
**Authentication → URL Configuration** and add:
```
http://localhost:3000/api/auth/callback
```
Add your production domain here too when you deploy.

---

## 🚀 Running the App

```bash
# Development (Turbopack hot-reload)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build      # production build
npm start          # serve production build
npm run typecheck  # TS check, no emit
npm run lint       # ESLint
```

---

## ✉️ Email Template Preview

Email templates are built with [React Email](https://react.email) and live in `src/lib/email/`.
You can preview and iterate on them locally without sending real emails:

```bash
npm run email:preview
```

Opens the React Email preview server at **[http://localhost:3001](http://localhost:3001)**.

> **Important:** keep this server on port `3001` — the Next.js dev server runs on `3000`.
> Mixing the two ports causes spurious `socket.io` 404s in the Next.js console.

### Templates

| File | Recipient | Trigger |
|---|---|---|
| `EnquiryNotificationEmail.tsx` | `admin@rekro.com.au` | New enquiry submitted |
| `EnquiryConfirmationEmail.tsx` | Enquiry sender | New enquiry submitted |

Both templates accept `PreviewProps` so the preview server renders them with realistic sample data automatically.

### How enquiry emails work

```
POST /api/enquiries
  └─ sendEnquiryNotification()  → admin@rekro.com.au   (new enquiry alert)
  └─ sendEnquiryConfirmation()  → sender's email       (receipt confirmation)
```

Both are sent via **Resend** from `admin@rekro.com.au`. The unit name is omitted from
the email when `listingType` is `"entire_property"`.

> Set `RESEND_API_KEY` in `.env.local` to enable real sending. Without it, the functions
> log a warning and return `null` — the API route continues without failing.

---

## 📁 Project Structure

```
rekro/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (authenticated)/          # Route group — login required
│   │   │   ├── layout.tsx            #   Client auth guard → redirect if no session
│   │   │   ├── applications/page.tsx #   /applications
│   │   │   ├── profile/page.tsx      #   /profile
│   │   │   ├── profile/settings/     #   /profile/settings
│   │   │   └── property/liked/       #   /property/liked
│   │   ├── (unauthenticated)/        # Route group — public layout variant
│   │   ├── api/                      # API route handlers
│   │   │   ├── auth/callback/        #   GET  — Supabase OAuth/OTP callback
│   │   │   ├── auth/otp/             #   POST — magic-link trigger
│   │   │   ├── property/             #   POST — create property (multipart)
│   │   │   ├── property/[id]/        #   PATCH / DELETE
│   │   │   ├── application/          #   POST — upsert draft
│   │   │   ├── application/submit/   #   POST — submit for review
│   │   │   ├── application/status/   #   PATCH — update status (landlord+)
│   │   │   ├── application/withdraw/ #   POST — withdraw
│   │   │   ├── application/snapshot/ #   POST — create snapshot
│   │   │   ├── enquiries/            #   POST — guest + authenticated enquiry
│   │   │   ├── user/profile/         #   PATCH — update profile
│   │   │   ├── user/phone-verification/ # POST
│   │   │   └── voiceflow/properties/ #   POST — chatbot search endpoint
│   │   ├── property/[id]/page.tsx    # Public property detail ("use client")
│   │   ├── AppShell.tsx              # Root shell: header, modals, auth state sync
│   │   ├── layout.tsx                # HTML shell, providers, metadata
│   │   ├── page.tsx                  # / — listings, search, filters (force-dynamic)
│   │   └── globals.css               # Tailwind v4 import + all CSS design tokens
│   │
│   ├── components/
│   │   ├── common/                   # Design system primitives
│   │   │   ├── Button.tsx            #   primary / secondary / ghost / danger
│   │   │   ├── Input.tsx             #   text input with label + error
│   │   │   ├── Modal.tsx             #   focus-trapped accessible modal
│   │   │   ├── Toast.tsx             #   success / error / info / warning
│   │   │   ├── Icon.tsx              #   SVG icon sprite wrapper
│   │   │   ├── Visual.tsx            #   Next.js Image wrapper with fallback
│   │   │   ├── RoleGuard.tsx         #   conditional render by role
│   │   │   ├── Skeleton.tsx          #   loading skeletons
│   │   │   ├── MapView.tsx           #   Google Maps embed
│   │   │   └── ...                   #   Select, Textarea, Checkbox, Loader, Banner…
│   │   ├── layout/
│   │   │   ├── Header.tsx            #   fixed top nav
│   │   │   └── QueryProvider.tsx     #   TanStack Query client + devtools
│   │   ├── Auth/                     # Auth modal, OTP form, email verification
│   │   ├── Properties/               # PropertyList (infinite scroll), PropertyCard
│   │   ├── Property/                 # Detail view, image gallery, enquiry form
│   │   ├── PropertyForm/             # Create / edit multi-step form
│   │   ├── ApplicationForm/          # Tenant application multi-step form
│   │   ├── ApplicationReview/        # Landlord review UI
│   │   ├── Applications/             # Tenant list + status badges
│   │   └── Profile/                  # Profile edit, settings
│   │
│   ├── contexts/
│   │   ├── AuthModalContext.tsx      # Global auth modal open/close
│   │   ├── ToastContext.tsx          # Global toast queue
│   │   ├── ProfileCompletionContext.tsx
│   │   └── DocumentOperationsContext.tsx
│   │
│   ├── lib/
│   │   ├── config/
│   │   │   └── cache_config.ts       # CACHE_STRATEGIES constants for TanStack Query
│   │   ├── email/                    # Email module (Resend + React Email)
│   │   │   ├── EnquiryNotificationEmail.tsx  # Admin notification template
│   │   │   ├── EnquiryConfirmationEmail.tsx  # Sender confirmation template
│   │   │   ├── enquiries.tsx         #   sendEnquiryNotification / sendEnquiryConfirmation
│   │   │   ├── resend.ts             #   Resend client, FROM_EMAIL, ADMIN_EMAIL
│   │   │   ├── schemas.ts            #   Zod schemas + TS types for email payloads
│   │   │   └── index.ts              #   Re-exports
│   │   ├── hooks/                    # All TanStack Query hooks — CLIENT only
│   │   │   ├── auth.ts               #   useSessionUser, useLogout, useSignInWithOtp…
│   │   │   ├── roles.ts              #   useRoles() — RBAC helper
│   │   │   ├── property.ts           #   useProperties, useProperty, useCreateProperty…
│   │   │   ├── units.ts              #   useUnit, useToggleUnitLike…
│   │   │   ├── application.ts        #   useApplications, useSubmitApplication…
│   │   │   └── user.ts               #   useProfile, useUpdateProfile…
│   │   ├── queries/                  # Raw Supabase query fns (called by hooks)
│   │   ├── services/                 # Storage helpers (upload, getFileUrl)
│   │   ├── supabase/
│   │   │   ├── client.ts             #   Browser client (createBrowserClient)
│   │   │   ├── server.ts             #   Server client + getSession() + requireAuthForApi()
│   │   │   └── middleware.ts         #   updateSession() — cookie refresh per request
│   │   ├── utils/
│   │   │   ├── authorization.ts      #   hasRole, hasRoleLevel, ROLE_HIERARCHY
│   │   │   ├── pdfGenerator.ts       #   jsPDF application export
│   │   │   ├── geospatial.ts
│   │   │   ├── googleMaps.ts
│   │   │   └── dateUtils.ts
│   │   └── validators/               # Zod schemas for all API inputs
│   │       ├── property.ts
│   │       ├── application.ts
│   │       ├── enquiry.ts
│   │       └── user.ts
│   │
│   └── types/
│       ├── db.ts                     # Auto-generated Supabase types
│       ├── auth.types.ts             # SessionUser, OtpCredentials, ApiError
│       ├── property.types.ts
│       └── application.types.ts
│
├── database/
│   ├── tables/                       # CREATE TABLE SQL (source of truth)
│   ├── indexes/                      # Geospatial + perf indexes
│   ├── functions/                    # Postgres functions / triggers
│   ├── policies/                     # RLS policies
│   ├── storage/                      # Storage bucket config
│   └── views/
│
├── e2e/                              # Playwright E2E tests
├── docs/                             # Technical audit + standards docs
├── public/                           # Static assets
├── next.config.ts                    # Next.js + Sentry config
├── tailwind.config.ts
├── playwright.config.ts
└── .env.example
```

---

## 🗺️ Route Map

### Public

| Route | Notes |
|---|---|
| `/` | Listings + search + filters (`force-dynamic`, `"use client"`) |
| `/property/[id]` | Property detail, units, enquiry form (`"use client"`) |

### Authenticated `/(authenticated)/`

| Route | Who | Description |
|---|---|---|
| `/applications` | Tenant | Submitted applications + status |
| `/profile` | All | Edit profile, bio, preferences |
| `/profile/settings` | All | Notification + contact settings |
| `/property/liked` | All | Saved / liked properties |

### API `/api/`

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/otp` | POST | — | Send magic-link email |
| `/api/auth/callback` | GET | — | OAuth / OTP redirect handler |
| `/api/property` | POST | landlord+ | Create property + units + images (multipart) |
| `/api/property/[id]` | PATCH / DELETE | owner / admin | Update or delete property |
| `/api/application` | POST | tenant+ | Upsert draft application |
| `/api/application/submit` | POST | owner | Submit for landlord review |
| `/api/application/status` | PATCH | landlord+ | Approve / reject |
| `/api/application/withdraw` | POST | owner | Withdraw application |
| `/api/application/snapshot` | POST | owner | Save application snapshot PDF |
| `/api/enquiries` | POST | guest or auth | Submit property enquiry |
| `/api/user/profile` | PATCH | self | Update profile |
| `/api/user/phone-verification` | POST | self | Phone verification |
| `/api/voiceflow/properties/search` | POST | — | Chatbot property search |

---

## 💡 Key Concepts

### Authentication — magic-link only (no passwords)

1. User enters email → `POST /api/auth/otp` → Supabase sends a magic link
2. User clicks link → Supabase redirects to `/api/auth/callback`
3. `@supabase/ssr` middleware sets the session cookie
4. `useSessionUser()` fetches session + role in one query, cached for 5 minutes

Every API mutation calls `requireAuthForApi()` from `lib/supabase/server.ts` — it
validates the JWT server-side and returns a `SessionUser`. **Client-provided user IDs are
never trusted.**

### Role-Based Access Control

Five roles, ascending privilege:

```
user → tenant → landlord → admin → super_admin
```

```tsx
// In components
const { canManageProperties, hasRoleLevel } = useRoles();

// In API routes
const user = await requireAuthForApi(); // 401 if not authed
if (user.role !== "landlord") return errorResponse("Forbidden", 403);
```

### Data Fetching

| Where | How |
|---|---|
| Client component reads | TanStack Query hooks from `src/lib/hooks/` |
| Client component writes | `fetch("/api/...")` via a `useMutation` hook |
| Server component reads | `getSession()` + `createClient()` from `lib/supabase/server.ts` |
| Raw Supabase queries | `src/lib/queries/` — called by hooks, never from components directly |

### Cache Strategies

Import `CACHE_STRATEGIES` from `src/lib/config/cache_config.ts` and spread into `useQuery`:

| Strategy | staleTime | Use for |
|---|---|---|
| `STATIC` | 5 min | Property listings, profiles |
| `DYNAMIC` | 1 min | Applications, status updates |
| `USER_SPECIFIC` | 30 s | Session user, likes |
| `REALTIME` | 0 | Live data (future) |

### Design Tokens

All colours are CSS custom properties in `src/app/globals.css`. Always use tokens —
never raw hex values or hardcoded Tailwind greys.

```tsx
// ✅
className="bg-card text-foreground border-border"

// ❌
style={{ backgroundColor: "#ffffff" }}
```

---

## 🗄️ Database

SQL source of truth lives in `database/`. Changes are applied to Supabase manually.

Key tables: `users`, `user_roles`, `properties`, `units`, `applications`, `enquiries`,
`unit_likes`, `unit_shares`, `inspection_requests`, `invoices`.

Regenerate TypeScript types after schema changes:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/db.ts
```

---

## 🧪 Testing

```bash
npm test               # all tests, headless
npm run test:ui        # Playwright interactive UI
npm run test:headed    # browser visible
npm run test:chromium  # Chromium only
npm run test:report    # open last HTML report
```

Five smoke tests in `e2e/smoke.spec.ts` cover: homepage render, magic-link auth,
search → detail navigation, unauthenticated enquiry prompt, and protected route access.

---

## 📜 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack, hot-reload) on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run email:preview` | React Email preview server on port 3001 |
| `npm test` | Playwright E2E tests |
| `npm run test:ui` | Playwright interactive UI |
| `npm run test:report` | Open last test HTML report |

---

## 📚 Further Reading

| Doc | Path |
|---|---|
| **Coding standards** | [`docs/08-coding-standards.md`](./docs/08-coding-standards.md) |
| Technical docs index | [`docs/README.md`](./docs/README.md) |
| Performance audit | [`docs/01-performance.md`](./docs/01-performance.md) |
| Security audit | [`docs/02-security.md`](./docs/02-security.md) |
| Scalability | [`docs/03-scalability.md`](./docs/03-scalability.md) |
| Recommended libraries | [`docs/04-libraries.md`](./docs/04-libraries.md) |
| Suggested features | [`docs/06-suggested-features.md`](./docs/06-suggested-features.md) |
| Production readiness | [`docs/07-production-readiness.md`](./docs/07-production-readiness.md) |
