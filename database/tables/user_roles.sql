-- User roles enum
CREATE TYPE public.app_role AS ENUM (
  'user',        -- Regular users looking for properties
  'tenant',      -- Tenants renting properties
  'landlord',    -- Property owners/managers
  'admin',       -- System administrators
);

create table public.user_roles (
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamp with time zone null default now(),
  constraint user_roles_pkey primary key (user_id, role),
  constraint user_roles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_roles_by_role on public.user_roles using btree (role) TABLESPACE pg_default;

-- RLS
alter table public.user_roles enable row level security;
CREATE POLICY "Admins manage roles" ON public.user_roles TO public USING (has_role('admin'::app_role));
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO public USING ((auth.uid() = user_id));