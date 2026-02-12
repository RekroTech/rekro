create table public.properties (
  id uuid not null default gen_random_uuid (),
  landlord_id uuid null,
  created_by uuid null,
  title text not null,
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
  price integer not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint properties_pkey primary key (id),
  constraint properties_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint properties_landlord_id_fkey foreign KEY (landlord_id) references landlords (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists properties_by_created_by on public.properties using btree (created_by) TABLESPACE pg_default;

create index IF not exists properties_by_address_gin on public.properties using gin (address) TABLESPACE pg_default;

create index IF not exists properties_by_landlord on public.properties using btree (landlord_id) TABLESPACE pg_default;