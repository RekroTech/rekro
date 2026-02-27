import type { Gender, PreferredContactMethod, EmploymentStatus, StudentStatus, Document } from "@/types/db";

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

export interface PersonalDetailsFormState {
  image_url: string | null;
  full_name: string;
  username: string;
  phone: string;
  bio: string;
  occupation: string;
  date_of_birth: string;
  gender: "" | Gender;
  preferred_contact_method: PreferredContactMethod;
  native_language: string;
}

// ---------------------------------------------------------------------------
// Residency (stored in `user_application_profile.visa_status`)
// ---------------------------------------------------------------------------

export interface ResidencyFormState {
  isCitizen: boolean | null;
  visaStatus: string | null;
  documents: {
    passport?: Document;
    visa?: Document;
  };
}

// ---------------------------------------------------------------------------
// Income (stored in `user_application_profile.*`)
// ---------------------------------------------------------------------------

export interface IncomeDetailsFormState {
  // Employment - using DB enum types directly
  employmentStatus: EmploymentStatus;
  employmentType: string | null;
  incomeSource: string | null;
  incomeFrequency: string | null;
  incomeAmount: number | null;

  // Student - using DB enum types directly
  studentStatus: StudentStatus;
  financeSupportType: string | null;
  financeSupportDetails: string | null;

  // Documents specific to income verification
  documents: {
    payslips?: Document;
    bankStatement?: Document;
    employmentLetter?: Document;
    studentId?: Document;
    coe?: Document;
    proofOfFunds?: Document;
  };
}

// ---------------------------------------------------------------------------
// Rental preferences (mix of top-level and application profile)
// ---------------------------------------------------------------------------

export interface RentalPreferencesFormState {
  current_location: Record<string, unknown> | null;
  destination_location: Record<string, unknown> | null;
  max_budget_per_week: number | null;
  preferred_locality: string | null;
  has_pets: boolean | null;
  smoker: boolean | null;
}

export interface AdditionalDocumentsFormState {
    referenceLetter?: Document;
    guarantorLetter?: Document;
    drivingLicense?: Document;
}

export type ProfileCompletionDetails = {
  // Residency
  isCitizen: boolean | null;
  visaStatus?: string | null;

  // Income / study - using DB enum types
  employmentStatus: EmploymentStatus;
  employmentType: string | null;
  incomeSource: string | null;
  incomeFrequency: string | null;
  incomeAmount: number | null;
  studentStatus: StudentStatus;
  financeSupportType: string | null;
  financeSupportDetails: string | null;

  // (Future/optional) preferences – currently not used in completion
  preferredMoveInDate?: string | null;
  preferredRentalDuration?: string | null;

  // Rental prefs (these are mostly stored in DB, but UI might pass them too)
  max_budget_per_week?: number | null;
  preferred_locality?: string | null;
};