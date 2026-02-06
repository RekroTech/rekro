create table public.unit_availability (
  id uuid not null default gen_random_uuid (),
  unit_id uuid not null,
  available_from date null,
  available_to date null,
  is_available boolean null default true,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint unit_availability_pkey primary key (id),
  constraint unit_availability_unit_id_fkey foreign KEY (unit_id) references units (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists unit_availability_by_unit on public.unit_availability using btree (unit_id) TABLESPACE pg_default;

create index IF not exists unit_availability_by_dates on public.unit_availability using btree (available_from, available_to) TABLESPACE pg_default;