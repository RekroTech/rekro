create table public.landlords (
  id uuid not null default gen_random_uuid (),
  owner_user_id uuid null,
  display_name text not null,
  contact_email text null,
  contact_phone text null,
  abn text null,
  address text null,
  created_at timestamp with time zone null default now(),
  constraint landlords_pkey primary key (id),
  constraint landlords_owner_user_id_fkey foreign KEY (owner_user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists landlords_by_owner on public.landlords using btree (owner_user_id) TABLESPACE pg_default;