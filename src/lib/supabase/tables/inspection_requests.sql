create table public.inspection_requests (
  id uuid not null default gen_random_uuid (),
  requested_by uuid not null,
  property_id uuid not null,
  unit_id uuid null,
  status public.inspection_status not null default 'requested'::inspection_status,
  channel public.inspection_channel not null default 'in_person'::inspection_channel,
  requested_times timestamp with time zone [] null,
  scheduled_time timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint inspection_requests_pkey primary key (id),
  constraint inspection_requests_property_id_fkey foreign KEY (property_id) references properties (id) on delete CASCADE,
  constraint inspection_requests_requested_by_fkey foreign KEY (requested_by) references users (id) on delete CASCADE,
  constraint inspection_requests_unit_id_fkey foreign KEY (unit_id) references units (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists inspection_by_property on public.inspection_requests using btree (property_id) TABLESPACE pg_default;

create index IF not exists inspection_by_user on public.inspection_requests using btree (requested_by) TABLESPACE pg_default;

create index IF not exists inspection_by_status on public.inspection_requests using btree (status) TABLESPACE pg_default;