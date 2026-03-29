-- Enum types for applications

-- Application type: individual or group application
create type public.application_type as enum ('individual', 'group');

create type public.application_status as enum('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn');

create type public.occupancy_type as enum('single', 'dual');
-- Application status: workflow states
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
  move_in_date date null,
  rental_duration integer null,
  proposed_rent numeric null,
  total_rent numeric null,
  inclusions jsonb not null default '{}'::jsonb,
  occupancy_type public.occupancy_type not null default 'single'::occupancy_type,
  constraint applications_pkey primary key (id),
  constraint applications_property_id_fkey foreign KEY (property_id) references properties (id) on delete CASCADE,
  constraint applications_unit_id_fkey foreign KEY (unit_id) references units (id) on delete set null,
  constraint applications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists applications_by_user on public.applications using btree (user_id) TABLESPACE pg_default;

create index IF not exists applications_by_property on public.applications using btree (property_id) TABLESPACE pg_default;

create index IF not exists applications_by_unit on public.applications using btree (unit_id) TABLESPACE pg_default;

create index IF not exists applications_by_status on public.applications using btree (status) TABLESPACE pg_default;

-- RLS
alter table public.applications enable row level security;
CREATE POLICY "Admin can update applications" ON public.applications FOR UPDATE TO public USING (has_role('admin'::app_role)) WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "Admin can view all applications" ON public.applications FOR SELECT TO public USING (has_role('admin'::app_role));
CREATE POLICY "insert own" ON public.applications FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "select own" ON public.applications FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "update own applications" ON public.applications FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK (((auth.uid() = user_id) AND ((status = 'draft'::application_status) OR (status = 'submitted'::application_status))));