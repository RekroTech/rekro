create table public.users (
  id uuid not null,
  email text null,
  full_name text null,
  username text null,
  image_url text null,
  phone text null,
  current_location jsonb null,
  max_budget_per_week integer null,
  receive_marketing_email boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists profiles_by_email on public.users using btree (email) TABLESPACE pg_default;
