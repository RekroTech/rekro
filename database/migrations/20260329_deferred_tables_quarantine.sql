-- Quarantine non-MVP tables: keep schema but deny access by default.
-- With RLS enabled + forced and no permissive policies, anon/authenticated users cannot read/write.

alter table if exists public.landlords enable row level security;
alter table if exists public.landlords force row level security;

alter table if exists public.inspection_requests enable row level security;
alter table if exists public.inspection_requests force row level security;

alter table if exists public.invoices enable row level security;
alter table if exists public.invoices force row level security;

alter table if exists public.payments enable row level security;
alter table if exists public.payments force row level security;

alter table if exists public.unit_availability enable row level security;
alter table if exists public.unit_availability force row level security;

alter table if exists public.unit_shares enable row level security;
alter table if exists public.unit_shares force row level security;

-- Correct index targets for unit_shares (table name was previously mismatched).
drop index if exists public.property_shares_by_unit;
drop index if exists public.property_shares_by_shared_by;
create index if not exists unit_shares_by_unit on public.unit_shares using btree (unit_id) tablespace pg_default;
create index if not exists unit_shares_by_shared_by on public.unit_shares using btree (shared_by) tablespace pg_default;

