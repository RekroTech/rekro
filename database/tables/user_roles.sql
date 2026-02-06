-- User roles enum
CREATE TYPE public.app_role AS ENUM (
  'tenant',      -- Regular users looking for properties
  'landlord',    -- Property owners/managers
  'admin'        -- System administrators
);

create table public.user_roles (
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamp with time zone null default now(),
  constraint user_roles_pkey primary key (user_id, role),
  constraint user_roles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_roles_by_role on public.user_roles using btree (role) TABLESPACE pg_default;