create table public.users (
  id uuid not null,
  email text null,
  full_name text null,
  username text null,
  image_url text null,
  phone text null,
  current_location jsonb null,
  receive_marketing_email boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  date_of_birth date null,
  gender text null,
  occupation text null,
  bio text null,
  preferred_contact_method text null default 'email'::text,
  notification_preferences jsonb null default '{}'::jsonb,
  native_language text null,
  discoverable boolean not null default false,
  share_contact boolean not null default false,
  phone_verified_at timestamp with time zone null,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint gender_check check (
    (
      gender = any (
        array[
          'male'::text,
          'female'::text,
          'non_binary'::text,
          'prefer_not_to_say'::text
        ]
      )
    )
  ),
  constraint preferred_contact_check check (
    (
      preferred_contact_method = any (array['email'::text, 'phone'::text, 'sms'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists profiles_by_email on public.users using btree (email) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_timestamp ();

-- RLS
alter table public.users enable row level security;
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT TO public USING (has_role('admin'::app_role));
CREATE POLICY "authenticated can view all profiles" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users can update own profile" ON public.users FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));