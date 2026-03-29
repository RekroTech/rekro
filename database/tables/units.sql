-- Create listing type enum
create type public.listing_type as enum ('entire_home', 'room');

create type public.unit_status as enum ('active', 'leased', 'inactive');

create table public.units (
  id uuid not null default gen_random_uuid (),
  property_id uuid not null,
  listing_type public.listing_type not null,
  name text null,
  description text null,
  price integer not null,
  bond_amount integer null,
  min_lease integer null,
  max_lease integer null,
  max_occupants integer null,
  size_sqm numeric null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  available_from date null default now(),
  available_to date null,
  is_available boolean not null default true,
  features text[] null,
  status public.unit_status null default 'inactive'::unit_status,
  constraint units_pkey primary key (id),
  constraint units_property_id_fkey foreign KEY (property_id) references properties (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists units_by_property on public.units using btree (property_id) TABLESPACE pg_default;

create index IF not exists units_by_listing_type on public.units using btree (listing_type) TABLESPACE pg_default;

create index IF not exists units_by_price on public.units using btree (price) TABLESPACE pg_default;

create index IF not exists units_by_status on public.units using btree (status) TABLESPACE pg_default;

create index IF not exists units_features_gin on public.units using gin (features) TABLESPACE pg_default;

create index IF not exists idx_units_active_status_available_from on public.units using btree (status, available_from) TABLESPACE pg_default
where
  (status = 'active'::unit_status);

create index IF not exists units_by_available_from on public.units using btree (available_from) TABLESPACE pg_default;

-- RLS
alter table public.units enable row level security;
CREATE POLICY units_admin_all ON public.units TO authenticated USING (has_role('admin'::app_role)) WITH CHECK (has_role('admin'::app_role));
CREATE POLICY units_public_read ON public.units FOR SELECT TO public USING (true);