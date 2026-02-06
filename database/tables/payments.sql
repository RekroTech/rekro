create table public.payments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  invoice_id uuid null,
  amount_cents integer not null,
  currency text not null default 'aud'::text,
  status public.payment_status not null,
  stripe_payment_intent_id text null,
  stripe_charge_id text null,
  created_at timestamp with time zone null default now(),
  constraint payments_pkey primary key (id),
  constraint payments_invoice_id_fkey foreign KEY (invoice_id) references invoices (id) on delete set null,
  constraint payments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists payments_by_user on public.payments using btree (user_id) TABLESPACE pg_default;

create index IF not exists payments_by_invoice on public.payments using btree (invoice_id) TABLESPACE pg_default;