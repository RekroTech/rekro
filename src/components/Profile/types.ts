import type { Gender, PreferredContactMethod } from "../../types/user.types";

/**
 * UI-facing types for the Profile page.
 *
 * Convention:
 * - DB / API types use snake_case (as generated in `db.ts`).
 * - UI state types use camelCase, except where we intentionally keep DB keys
 *   because we pass them directly to update APIs.
 */

// ---------------------------------------------------------------------------
// Personal details (top-level `users` table)
// ---------------------------------------------------------------------------

export type PersonalDetailsFormState = {
  full_name: string;
  username: string;
  phone: string;
  bio: string;
  occupation: string;
  date_of_birth: string;
  gender: "" | Gender;
  preferred_contact_method: PreferredContactMethod;
  native_language: string;
};

// ---------------------------------------------------------------------------
// Residency (stored in `user_application_profile.visa_status`)
// ---------------------------------------------------------------------------

export type ResidencyFormState = {
  isCitizen: boolean | null;
  visaStatus: string | null;
};

// ---------------------------------------------------------------------------
// Income (stored in `user_application_profile.*`)
// ---------------------------------------------------------------------------

export type IncomeDetailsFormState = {
  isWorking: boolean | null;
  isStudent: boolean | null;

  // employment
  employmentStatus: string | null;
  incomeSource: string | null;
  incomeFrequency: string | null;
  incomeAmount: number | null;

  // finance (student or otherwise)
  financeSupportType: string | null;
  financeSupportDetails: string | null;
};

// ---------------------------------------------------------------------------
// Rental preferences (mix of top-level and application profile)
// ---------------------------------------------------------------------------

export type RentalPreferencesFormState = {
  current_location: Record<string, unknown> | null;
  destination_location: Record<string, unknown> | null;
  max_budget_per_week: number | null;
  preferred_locality: string | null;
  has_pets: boolean | null;
  smoker: boolean | null;
};

