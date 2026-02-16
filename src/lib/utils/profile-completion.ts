import type { UserProfile, ProfileSection, ProfileCompletion } from "@/types/user.types";

/**
 * These details are provided by the Profile UI (see `src/app/(authenticated)/profile/page.tsx`).
 * We keep this shape local to avoid coupling completion logic to UI component state types.
 */
export type ProfileCompletionDetails = {
  // Residency
  isCitizen: boolean | null;
  /** UI camelCase */
  visaStatus?: string | null;
  /** Back-compat: some callers may still pass snake_case */
  visa_status?: string | null;

  // Income / study
  isWorking: boolean | null;
  isStudent: boolean | null;
  employmentStatus: string | null;
  incomeSource: string | null;
  incomeFrequency: string | null;
  incomeAmount: number | null;
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
 * (Email is shown but not editable; still counts because it exists for authenticated users.)
 */
export function calculatePersonalDetailsCompletion(user: UserProfile): number {
  const fields: unknown[] = [
    user.full_name,
    user.username,
    user.email,
    user.phone,
    user.date_of_birth,
    user.gender,
    user.occupation,
    user.bio,
    user.native_language,
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
export function calculateVisaDetailsCompletion(details: ProfileCompletionDetails | null, uploadedDocs: string[]): number {
  const isCitizen = details?.isCitizen ?? null;
  const visaStatus = (details?.visaStatus ?? details?.visa_status) ?? null;

  const checks: boolean[] = [];

  // Citizenship selection
  checks.push(isCitizen === true || isCitizen === false);

  // Visa type required for non-citizen
  if (isCitizen === false) {
    checks.push(isFilled(visaStatus));
  }

  // Documents
  checks.push(uploadedDocs.includes("passport"));
  if (isCitizen === false) {
    checks.push(uploadedDocs.includes("visa"));
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
export function calculateIncomeDetailsCompletion(details: ProfileCompletionDetails | null, uploadedDocs: string[]): number {
  const d = details ?? null;

  const checks: boolean[] = [];

  // Must pick employment status
  const isWorking = d?.isWorking ?? null;
  checks.push(isWorking === true || isWorking === false);

  if (isWorking === true) {
    checks.push(isFilled(d?.employmentStatus));
    checks.push(isFilled(d?.incomeSource));
    checks.push(isFilled(d?.incomeFrequency));
    checks.push(d?.incomeAmount !== null && d?.incomeAmount !== undefined && !Number.isNaN(d?.incomeAmount));
    checks.push(uploadedDocs.includes("payslips"));
  }

  if (isWorking === false) {
    const isStudent = d?.isStudent ?? null;
    checks.push(isStudent === true || isStudent === false);

    // finance support fields always required when not working (per UI)
    checks.push(isFilled(d?.financeSupportType));
    checks.push(isFilled(d?.financeSupportDetails));
    checks.push(uploadedDocs.includes("proofOfFunds"));

    if (isStudent === true) {
      checks.push(uploadedDocs.includes("studentId"));
      checks.push(uploadedDocs.includes("coe"));
    }
  }

  return percent(checks.filter(Boolean).length, checks.length);
}

/**
 * Additional documents section only includes the "optional" extra docs.
 */
export function calculateAdditionalDocumentsCompletion(uploadedDocs: string[]): number {
  const optionalDocs = ["drivingLicense", "referenceLetter", "guarantorLetter"];
  const uploaded = optionalDocs.filter((d) => uploadedDocs.includes(d)).length;
  return percent(uploaded, optionalDocs.length);
}

/**
 * Rental preferences completion is based on the fields present in `RentalPreferencesSection`.
 * We treat pets/smoker as optional (you can legitimately be false).
 */
export function calculateLocationPreferencesCompletion(user: UserProfile): number {
  const app = user.user_application_profile;

  const hasCurrentLocation = user.current_location !== null && user.current_location !== undefined;
  const maxBudget = app?.max_budget_per_week;
  const preferredLocality = app?.preferred_locality;

  const checks = [
    hasCurrentLocation,
    maxBudget !== null && maxBudget !== undefined,
    isFilled(preferredLocality),
  ];

  return percent(checks.filter(Boolean).length, checks.length);
}

export function getProfileSections(
  user: UserProfile,
  details: ProfileCompletionDetails | null,
  uploadedDocs: string[] = []
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
  uploadedDocs: string[] = []
): ProfileCompletion {
  const sections = getProfileSections(user, details, uploadedDocs);

  const requiredSections = sections.filter((s) => s.required);
  const optionalSections = sections.filter((s) => !s.required);

  // Simple weighted average: emphasize required sections.
  const requiredWeight = 0.85;
  const optionalWeight = 0.15;

  const requiredAvg =
    requiredSections.length > 0
      ? requiredSections.reduce((sum, s) => sum + s.completionPercentage, 0) / requiredSections.length
      : 0;

  const optionalAvg =
    optionalSections.length > 0
      ? optionalSections.reduce((sum, s) => sum + s.completionPercentage, 0) / optionalSections.length
      : 0;

  const totalPercentage = Math.round(requiredAvg * requiredWeight + optionalAvg * optionalWeight);

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
