create table public.application_snapshot (
  id uuid not null default gen_random_uuid (),
  application_id uuid not null,
  snapshot jsonb not null,
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  note text null,
  constraint application_snapshot_pkey1 primary key (id),
  constraint application_snapshot_application_id_fkey1 foreign KEY (application_id) references applications (id) on delete CASCADE,
  constraint application_snapshot_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists application_snapshot_by_application on public.application_snapshot using btree (application_id, created_at desc) TABLESPACE pg_default;