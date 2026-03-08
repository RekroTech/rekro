# Suggested Features — reKro

> Audit date: March 2026 · Prioritised by user value vs. implementation effort.

---

## Priority 1 — High Value, Achievable Now

### 1.1 Real-time Application Status Notifications

**What:** Tenants and landlords receive instant in-app and email notifications when an
application status changes (submitted → under_review → approved/rejected).

**Why:** Reduces "where is my application?" enquiries. Standard in every major rental
platform (Domain, realestate.com.au, Zillow).

**Implementation:**
- Supabase Realtime on `applications` table (already has status enum)
- Toast notification on status change via `ToastContext`
- Email via existing Resend integration
- Inngest background job for email (decoupled from DB trigger)

**Effort:** Medium (2–3 days) · **Impact:** High

---

### 1.2 Saved Search & Alerts

**What:** Users can save a search (location + filters) and receive email/push alerts when
new matching properties are listed.

**Why:** Rental market moves fast. Users who get first-mover alerts are more likely to
convert.

**Implementation:**
- New `saved_searches` table: `{ id, user_id, filters jsonb, name, alert_enabled }`
- Cron job (Inngest scheduled function) or Supabase webhook on `properties INSERT`
- Match new properties against saved search filters
- Send email via Resend

**Effort:** Medium (3–4 days) · **Impact:** High

---

### 1.3 Inspection Request Calendar / Scheduling

**What:** The `inspection_requests` table already exists. Build the UI for landlords to
set available inspection slots and tenants to book them.

**Why:** Inspections are the highest-friction step in the rental journey. Automating
scheduling reduces back-and-forth messages.

**Implementation:**
- Landlord: Create inspection slots (date/time range picker using `react-aria`)
- Tenant: View available slots, book one, receive confirmation email
- iCal / Google Calendar export link
- Automated reminder email 24 hours before

**Effort:** High (1 week) · **Impact:** Very High

---

### 1.4 Tenant Profile Completeness Score

**What:** A visual indicator showing tenants how complete their application profile is
(photo, bio, employment, references, ID verification).

**Why:** Landlords are more likely to accept applications from tenants with complete
profiles. Nudging completeness increases conversion.

**Implementation:**
- `ProfileCompletionContext` already exists — extend it with a score calculator
- Show progress bar in the profile page and dashboard
- Show "Complete your profile" banner when score < 80%

**Effort:** Low (1 day) · **Impact:** High

---

### 1.5 Property Comparison Tool

**What:** Users can select up to 3 properties and view them side-by-side (price, bedrooms,
bathrooms, amenities, location).

**Why:** Common feature in real estate platforms that reduces decision friction.

**Implementation:**
- Global comparison state (TanStack Query or React context)
- Sticky comparison bar at bottom of screen
- Comparison modal/page with side-by-side table
- Share comparison as URL (nuqs for URL state)

**Effort:** Medium (2–3 days) · **Impact:** Medium

---

## Priority 2 — Growth Features

### 2.1 In-app Messaging Between Tenant and Landlord

**What:** Direct messaging thread between tenant applicants and property landlords, scoped
to a specific property/application.

**Why:** Currently all communication happens via email enquiries. In-app messaging keeps
the conversation in the platform and reduces churn.

**Implementation:**
- New `messages` table: `{ id, application_id, sender_id, recipient_id, content, read_at }`
- Supabase Realtime subscription for live message delivery
- Unread badge in header
- Email fallback if recipient is offline

**Effort:** High (1–2 weeks) · **Impact:** Very High

---

### 2.2 Verified Identity / Background Check Integration

**What:** Integration with an identity verification provider (e.g., Stripe Identity, AU
Post Digital ID, or Equifax) to verify tenant identity and run background checks.

**Why:** Landlords rank tenant trust as their #1 concern. Verified profiles command higher
application conversion.

**Implementation:**
- Stripe Identity API for document verification
- Store verification status in `users` table: `identity_verified_at`
- Show verification badge on profiles and applications

**Effort:** High · **Impact:** Very High

---

### 2.3 Landlord Analytics Dashboard

**What:** Dashboard showing property performance: views, enquiry rate, application
conversion, time to lease.

**Why:** Landlords make data-driven pricing decisions. Unique insight is a strong
retention hook.

**Implementation:**
- Track property views (Supabase `property_views` table or Vercel Analytics events)
- Aggregate metrics with Supabase views/RPC functions
- Charts using `recharts` or native SVG

**Effort:** Medium (3–5 days) · **Impact:** High (retention)

---

### 2.4 Map View for Property Listings

**What:** Toggle between grid view and a map view showing all properties as pins.
`@react-google-maps/api` is already installed.

**Why:** Geographic search is how most renters think about their search. Map view is
expected by users.

**Implementation:**
- Map component already scaffolded (`/src/lib/utils/googleMaps.ts`)
- Cluster pins for density using `@googlemaps/markerclusterer`
- Click pin → show property card popup
- Sync map bounds with URL via nuqs

**Effort:** Medium (3–4 days) · **Impact:** High

---

### 2.5 Roommate Matching / Social Discovery

**What:** The `unit_shares`, `unit_likes`, and `user.discoverable` fields suggest a
social/roommate matching concept. Build a "Find a Roommate" feature where users can
express interest in co-tenants.

**Why:** Differentiator vs. Domain/realestate.com.au. Unique value for the "share"
listing type.

**Implementation:**
- Filter `users` by `discoverable = true`
- Show profile cards (name, bio, occupation, preferred contact)
- `unit_likes` already tracks property interest — match users who like the same listing
- Express interest → send in-app message or email

**Effort:** Medium (3–5 days) · **Impact:** Very High (differentiation)

---

### 2.6 Document Vault

**What:** Tenants can securely store and share rental-relevant documents (pay slips,
bank statements, rental history, references) from a central profile vault.

**Why:** Reduces friction of attaching documents to every application separately.

**Implementation:**
- Supabase Storage (already configured for property images — extend for user documents)
- `user_documents` table: `{ id, user_id, type, file_path, is_verified, uploaded_at }`
- Share document with a specific application (link, not embed)
- Landlord can view shared documents from the application review screen

**Effort:** Medium (3–5 days) · **Impact:** High

---

## Priority 3 — Platform Maturity

### 3.1 Multi-language Support (i18n)

**When:** When targeting non-English speaking communities.
**Tool:** `next-intl` (works with App Router, type-safe)

### 3.2 Mobile App (React Native / Expo)

**When:** Mobile usage exceeds 60% of traffic.
**Tool:** Expo + Supabase React Native SDK

### 3.3 Payments Integration

**When:** Rent collection or bond processing is in scope.
**Tool:** Stripe (already a common choice with Supabase)
- `invoices` table already exists in the schema

### 3.4 AI-Powered Listing Assistant

**What:** Auto-generate property descriptions, suggest pricing based on comparable
listings, and summarise application profiles for landlords.
**Tool:** Vercel AI SDK + OpenAI GPT-4o

### 3.5 Virtual Tour Integration

**What:** Embed 360° virtual tours (Matterport, Google Street View Indoor) on property
detail pages.
**Tool:** iFrame embed or Matterport SDK

---

## Feature Backlog Summary

| Feature | Priority | Effort | Impact |
|---|---|---|---|
| Real-time application notifications | 1 | M | High |
| Saved search + alerts | 1 | M | High |
| Inspection scheduling UI | 1 | H | Very High |
| Profile completeness score | 1 | L | High |
| Property comparison tool | 1 | M | Medium |
| In-app messaging | 2 | H | Very High |
| Identity verification | 2 | H | Very High |
| Landlord analytics | 2 | M | High |
| Map view | 2 | M | High |
| Roommate matching | 2 | M | Very High |
| Document vault | 2 | M | High |
| i18n | 3 | H | Medium |
| Mobile app | 3 | VH | High |
| Payments | 3 | H | High |
| AI listing assistant | 3 | M | Medium |

