create table public.invoices (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  landlord_id uuid null,
  application_id uuid null,
  property_id uuid null,
  unit_id uuid null,
  status public.invoice_status not null default 'draft'::invoice_status,
  currency text not null default 'aud'::text,
  amount_cents integer not null,
  due_date date null,
  stripe_invoice_id text null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint invoices_pkey primary key (id),
  constraint invoices_application_id_fkey foreign KEY (application_id) references applications (id) on delete set null,
  constraint invoices_landlord_id_fkey foreign KEY (landlord_id) references landlords (id) on delete set null,
  constraint invoices_property_id_fkey foreign KEY (property_id) references properties (id) on delete set null,
  constraint invoices_unit_id_fkey foreign KEY (unit_id) references units (id) on delete set null,
  constraint invoices_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists invoices_by_user on public.invoices using btree (user_id) TABLESPACE pg_default;

create index IF not exists invoices_by_status on public.invoices using btree (status) TABLESPACE pg_default;