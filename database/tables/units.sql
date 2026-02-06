-- Create listing type enum
create type public.listing_type as enum ('entire_home', 'room');

create table public.units (
  id uuid not null default gen_random_uuid (),
  property_id uuid not null,
  listing_type public.listing_type not null,
  name text null,
  description text null,
  price_per_week integer not null,
  bond_amount integer null,
  bills_included boolean null default false,
  min_lease_weeks integer null,
  max_lease_weeks integer null,
  max_occupants integer null,
  size_sqm numeric null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint units_pkey primary key (id),
  constraint units_property_id_fkey foreign KEY (property_id) references properties (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists units_by_property on public.units using btree (property_id) TABLESPACE pg_default;

create index IF not exists units_by_listing_type on public.units using btree (listing_type) TABLESPACE pg_default;

create index IF not exists units_by_price on public.units using btree (price_per_week) TABLESPACE pg_default;