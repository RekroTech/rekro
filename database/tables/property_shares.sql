create table public.property_shares (
  id uuid not null default gen_random_uuid (),
  shared_by uuid null,
  unit_id uuid null,
  channel text null,
  to_value text null,
  created_at timestamp with time zone null default now(),
  constraint property_shares_pkey primary key (id),
  constraint property_shares_shared_by_fkey foreign KEY (shared_by) references users (id) on delete set null,
  constraint property_shares_unit_id_fkey foreign KEY (unit_id) references units (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists property_shares_by_unit on public.property_shares using btree (unit_id) TABLESPACE pg_default;

create index IF not exists property_shares_by_shared_by on public.property_shares using btree (shared_by) TABLESPACE pg_default;