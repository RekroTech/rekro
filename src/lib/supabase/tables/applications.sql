create table public.applications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  property_id uuid not null,
  unit_id uuid null,
  application_type public.application_type not null,
  status public.application_status not null default 'draft'::application_status,
  message text null,
  created_at timestamp with time zone null default now(),
  submitted_at timestamp with time zone null,
  updated_at timestamp with time zone null default now(),
  group_id uuid null,
  constraint applications_pkey primary key (id),
  constraint applications_property_id_fkey foreign KEY (property_id) references properties (id) on delete CASCADE,
  constraint applications_unit_id_fkey foreign KEY (unit_id) references units (id) on delete set null,
  constraint applications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists applications_by_user on public.applications using btree (user_id) TABLESPACE pg_default;

create index IF not exists applications_by_property on public.applications using btree (property_id) TABLESPACE pg_default;

create index IF not exists applications_by_unit on public.applications using btree (unit_id) TABLESPACE pg_default;

create index IF not exists applications_by_status on public.applications using btree (status) TABLESPACE pg_default;