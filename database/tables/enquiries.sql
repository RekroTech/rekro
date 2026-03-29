create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  unit_id uuid not null,
  user_id uuid null, -- nullable for guests

  message text not null,

  -- Guest-only (unauthenticated) contact fields
  guest_name text null,
  guest_email text null,
  guest_phone text null,

  -- Optional snapshots (useful even for logged-in users)
  contact_name text null,
  contact_email text null,
  contact_phone text null,

  -- Optional meta (good for abuse/debug)
  ip inet null,
  user_agent text null,

  constraint enquiries_unit_fk
    foreign key (unit_id) references public.units(id) on delete cascade,

  constraint enquiries_user_fk
    foreign key (user_id) references auth.users(id) on delete set null,

  -- Data hygiene: require either a logged-in user OR a guest email
  constraint enquiries_require_identity
    check (
      user_id is not null
      or (guest_email is not null and length(trim(guest_email)) > 0)
    ),

  -- If it's a guest enquiry, force user_id to be null (keeps intent clear)
  constraint enquiries_guest_has_no_user
    check (
      not (guest_email is not null and length(trim(guest_email)) > 0 and user_id is not null)
    )
);

-- Indexes
create index if not exists enquiries_unit_created_at_idx
  on public.enquiries (unit_id, created_at desc);

create index if not exists enquiries_user_created_at_idx
  on public.enquiries (user_id, created_at desc);

create index if not exists enquiries_guest_email_idx
  on public.enquiries (guest_email);

-- RLS
alter table public.enquiries enable row level security;
create policy "Public can insert enquiries" on public.enquiries for insert to anon, authenticated with check (
-- anon can only insert with user_id null
(auth.uid() is null and user_id is null) OR
-- authenticated can only insert for themselves (or set null if you want)
(auth.uid() is not null and (user_id is null or user_id = auth.uid())) );


