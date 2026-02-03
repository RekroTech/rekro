create table public.application_details (
  application_id uuid not null,
  move_in_date date null,
  rental_duration text null,
  employment_status text null,
  income_source text null,
  contact_phone text null,
  has_pets boolean null,
  smoker boolean null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint application_details_pkey primary key (application_id),
  constraint application_details_application_id_fkey foreign KEY (application_id) references applications (id) on delete CASCADE
) TABLESPACE pg_default;