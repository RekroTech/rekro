import type { UserProfile, ProfileSection, ProfileCompletion } from "@/types/user.types";
import type { Documents, EmploymentStatus, StudentStatus } from "@/types/db";

/**
 * These details are provided by the Profile UI (see `src/app/(authenticated)/profile/page.tsx`).
 * We keep this shape local to avoid coupling completion logic to UI component state types.
 */
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

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function percent(filled: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((filled / total) * 100);
}

/**
 * Personal details completion based on the fields currently editable in the UI.
 * These fields match PersonalDetailsFormState from Profile/types.ts
 */
export function calculatePersonalDetailsCompletion(user: UserProfile): number {
  const fields: unknown[] = [
    user.full_name,
    user.username,
    user.phone,
    user.date_of_birth,
    user.gender,
    user.occupation,
    user.bio,
    user.native_language,
    user.preferred_contact_method,
  ];

  const filled = fields.filter(isFilled).length;
  return percent(filled, fields.length);
}

/**
 * Visa details completion:
 * - Must choose citizenship/residency.
 * - If non-citizen: must choose visa type.
 * - Required docs:
 *    - passport always
 *    - visa doc only when non-citizen
 */
export function calculateVisaDetailsCompletion(details: ProfileCompletionDetails | null, uploadedDocs: Documents): number {
  const isCitizen = details?.isCitizen ?? null;
  const visaStatus = details?.visaStatus ?? null;

  const checks: boolean[] = [];

  // Citizenship selection
  checks.push(isCitizen === true || isCitizen === false);

  // Visa type required for non-citizen
  if (isCitizen === false) {
    checks.push(isFilled(visaStatus));
  }

  // Documents
  checks.push(uploadedDocs.passport !== undefined);
  if (isCitizen === false) {
    checks.push(uploadedDocs.visa !== undefined);
  }

  return percent(checks.filter(Boolean).length, checks.length);
}

/**
 * Income details completion matches `IncomeDetailsSection` rules:
 * - Must choose working status.
 * - If working: require income fields + payslips.
 * - If not working: must choose student status.
 *    - student: require finance support fields + student docs + proofOfFunds.
 *    - not student: require finance support fields + proofOfFunds.
 *
 * Bank statements are optional here because the UI marks them as helper-only (not required).
 */
export function calculateIncomeDetailsCompletion(details: ProfileCompletionDetails | null, uploadedDocs: Documents): number {
  const d = details ?? null;

  const checks: boolean[] = [];

  // Must pick employment status
  const employmentStatus = d?.employmentStatus ?? null;
  checks.push(employmentStatus === "working" || employmentStatus === "not_working");

  if (employmentStatus === "working") {
    checks.push(isFilled(d?.employmentType));
    checks.push(isFilled(d?.incomeSource));
    checks.push(isFilled(d?.incomeFrequency));
    checks.push(d?.incomeAmount !== null && d?.incomeAmount !== undefined && !Number.isNaN(d?.incomeAmount));
    checks.push(uploadedDocs.payslips !== undefined);
  }

  if (employmentStatus === "not_working") {
    const studentStatus = d?.studentStatus ?? null;
    checks.push(studentStatus === "student" || studentStatus === "not_student");

    // finance support fields always required when not working (per UI)
    checks.push(isFilled(d?.financeSupportType));
    checks.push(isFilled(d?.financeSupportDetails));
    checks.push(uploadedDocs.proofOfFunds !== undefined);

    if (studentStatus === "student") {
      checks.push(uploadedDocs.studentId !== undefined);
      checks.push(uploadedDocs.coe !== undefined);
    }
  }

  return percent(checks.filter(Boolean).length, checks.length);
}

/**
 * Additional documents section only includes the "optional" extra docs.
 */
export function calculateAdditionalDocumentsCompletion(uploadedDocs: Documents): number {
  const optionalDocs: Array<keyof Documents> = ["drivingLicense", "referenceLetter", "guarantorLetter"];
  const uploaded = optionalDocs.filter((d) => uploadedDocs[d] !== undefined).length;
  return percent(uploaded, optionalDocs.length);
}

/**
 * Rental preferences completion is based on the fields present in `RentalPreferencesSection`.
 * We treat pets/smoker as optional (you can legitimately be false).
 * Only checks the fields that are actually editable in the UI.
 */
export function calculateLocationPreferencesCompletion(user: UserProfile): number {
  const app = user.user_application_profile;

  const maxBudget = app?.max_budget_per_week;
  const preferredLocality = app?.preferred_locality;

  const checks = [
    maxBudget !== null && maxBudget !== undefined,
    isFilled(preferredLocality),
  ];

  return percent(checks.filter(Boolean).length, checks.length);
}

export function getProfileSections(
  user: UserProfile,
  details: ProfileCompletionDetails | null,
  uploadedDocs: Documents = {} as Documents
): ProfileSection[] {
  const personal = calculatePersonalDetailsCompletion(user);
  const visa = calculateVisaDetailsCompletion(details, uploadedDocs);
  const income = calculateIncomeDetailsCompletion(details, uploadedDocs);
  const additionalDocs = calculateAdditionalDocumentsCompletion(uploadedDocs);
  const rental = calculateLocationPreferencesCompletion(user);

  return [
    {
      id: "personal-details",
      title: "Personal Details",
      description: "Basic information about you",
      icon: "profile",
      completed: personal === 100,
      completionPercentage: personal,
      required: true,
    },
    {
      id: "visa-details",
      title: "Visa Details",
      description: "Citizenship status and visa documentation",
      icon: "map-pin",
      completed: visa === 100,
      completionPercentage: visa,
      required: true,
    },
    {
      id: "income-details",
      title: "Income Details",
      description: "Employment and financial information",
      icon: "dollar",
      completed: income === 100,
      completionPercentage: income,
      required: true,
    },
    {
      id: "documents",
      title: "Additional Documents",
      description: "Upload remaining documents",
      icon: "upload",
      completed: additionalDocs === 100,
      completionPercentage: additionalDocs,
      required: false,
    },
    {
      id: "location-preferences",
      title: "Rental Preference",
      description: "Your preferred locality and budget",
      icon: "map",
      completed: rental === 100,
      completionPercentage: rental,
      required: true,
    },
  ];
}

export function calculateProfileCompletion(
  user: UserProfile,
  details: ProfileCompletionDetails | null = null,
  uploadedDocs: Documents = {} as Documents
): ProfileCompletion {
  const sections = getProfileSections(user, details, uploadedDocs);

  const requiredSections = sections.filter((s) => s.required);

  // Total percentage is based only on required sections
  // Optional sections (like Additional Documents) don't contribute to the overall completion
  const requiredAvg =
    requiredSections.length > 0
      ? requiredSections.reduce((sum, s) => sum + s.completionPercentage, 0) / requiredSections.length
      : 0;

  const totalPercentage = Math.round(requiredAvg);

  const unlockedBadges: string[] = [];
  if (totalPercentage >= 25) unlockedBadges.push("Getting Started");
  if (totalPercentage >= 50) unlockedBadges.push("Halfway There");
  if (totalPercentage >= 75) unlockedBadges.push("Almost Done");
  if (totalPercentage >= 100) unlockedBadges.push("Profile Complete");

  if (sections.find((s) => s.id === "visa-details")?.completed) {
    unlockedBadges.push("Residency Ready");
  }
  if (sections.find((s) => s.id === "income-details")?.completed) {
    unlockedBadges.push("Financially Verified");
  }
  if (sections.find((s) => s.id === "personal-details")?.completed) {
    unlockedBadges.push("Identity Complete");
  }

  return {
    totalPercentage,
    sections,
    unlockedBadges,
    isComplete: sections.filter((s) => s.required).every((s) => s.completed),
  };
}
