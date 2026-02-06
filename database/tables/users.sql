create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  username text,
  image_url text,
  phone text,

  -- Optional “whole profile”
  current_location jsonb,
  destination_location jsonb,
  study_field text,
  study_level text,
  university text,
  languages text[],

  -- Preferences (optional)
  max_budget_per_week integer,
  receive_marketing_email boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index profiles_by_email on public.profiles using btree (email);
