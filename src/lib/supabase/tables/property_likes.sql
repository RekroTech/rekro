create table public.property_likes (
  user_id uuid not null,
  unit_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint property_likes_pkey primary key (user_id, unit_id),
  constraint property_likes_unit_id_fkey foreign KEY (unit_id) references units (id) on delete CASCADE,
  constraint property_likes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists property_likes_by_unit on public.property_likes using btree (unit_id) TABLESPACE pg_default;