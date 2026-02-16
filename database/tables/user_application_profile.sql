create table public.user_application_profile (
  user_id uuid not null,
  visa_status text null,
  employment_status text null,
  employment_type text null,
  income_source text null,
  income_frequency text null,
  income_amount numeric null,
  student_status text null,
  finance_support_type text null,
  finance_support_details text null,
  preferred_locality text null,
  max_budget_per_week integer null,
  has_pets boolean null,
  smoker boolean null,
  emergency_contact_name text null,
  emergency_contact_phone text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  documents jsonb not null default '{}'::jsonb,
  constraint user_application_profile_pkey primary key (user_id),
  constraint user_application_profile_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint uap_documents_is_object check ((jsonb_typeof(documents) = 'object'::text)),
  constraint uap_employment_status_check check (
    (
      (employment_status is null)
      or (
        employment_status = any (array['working'::text, 'not_working'::text])
      )
    )
  ),
  constraint uap_student_status_check check (
    (
      (student_status is null)
      or (
        student_status = any (array['student'::text, 'not_student'::text])
      )
    )
  )
) TABLESPACE pg_default;

create trigger update_user_application_profile_updated_at BEFORE
update on user_application_profile for EACH row
execute FUNCTION update_timestamp ();