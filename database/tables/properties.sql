create table public.properties (
  id uuid not null default gen_random_uuid (),
  landlord_id uuid null,
  created_by uuid null,
  description text null,
  address jsonb null,
  location jsonb null,
  latitude numeric null,
  longitude numeric null,
  property_type text null,
  bedrooms integer null,
  bathrooms integer null,
  car_spaces integer null,
  furnished boolean null default false,
  amenities text[] null,
  images text[] null,
  video_url text null,
  is_published boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  price integer null,
  bills_included boolean not null default false,
  constraint properties_pkey primary key (id),
  constraint properties_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint properties_landlord_id_fkey foreign KEY (landlord_id) references landlords (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists properties_by_created_by on public.properties using btree (created_by) TABLESPACE pg_default;

create index IF not exists properties_by_address_gin on public.properties using gin (address) TABLESPACE pg_default;

create index IF not exists properties_by_landlord on public.properties using btree (landlord_id) TABLESPACE pg_default;

create index IF not exists idx_properties_is_published_created_at_desc on public.properties using btree (is_published, created_at desc) TABLESPACE pg_default;

-- RLS
alter table public.properties enable row level security;
CREATE POLICY properties_admin_all ON public.properties TO authenticated USING (has_role('admin'::app_role)) WITH CHECK (has_role('admin'::app_role));
CREATE POLICY properties_public_read ON public.properties FOR SELECT TO public USING (true);