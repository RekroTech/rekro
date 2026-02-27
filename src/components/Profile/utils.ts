import type { UserProfile, ShareableProfile } from "@/types/user.types";
import type { ProfileFormState } from "@/components/Profile/hooks/useProfileForm";
import { calculateProfileCompletion } from "./profile-completion";

/**
 * Deep clone utility for plain JSON-ish data (objects/arrays/primitives/null).
 * We keep this local to avoid pulling a dependency.
 */
export function deepClone<T>(value: T): T {
    // structuredClone is available in modern browsers; fall back for older envs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sc = (globalThis as any).structuredClone as ((v: T) => T) | undefined;
    if (typeof sc === "function") return sc(value);
    return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Build shareable profile from user data and form state
 * Centralizes the logic for creating a shareable profile view
 *
 * @param user - User profile from API
 * @param formState - Current form state
 * @returns Shareable profile object
 */
export function buildShareableProfile(
    user: UserProfile,
    formState: ProfileFormState
): ShareableProfile {
    const { incomeDetails, residency, documents, rentalPreferences, personalDetails } = formState;

    // Calculate profile completion
    // IMPORTANT: completion logic reads personal + rental fields from `user`.
    // While editing, those changes live in form state until autosave completes.
    // Build a lightweight "virtual user" so completion updates immediately.
    const virtualUser: UserProfile = {
        ...user,
        full_name: personalDetails.full_name,
        username: personalDetails.username,
        phone: personalDetails.phone,
        date_of_birth: personalDetails.date_of_birth,
        gender: personalDetails.gender as UserProfile["gender"],
        occupation: personalDetails.occupation,
        bio: personalDetails.bio,
        native_language: personalDetails.native_language,
        preferred_contact_method: personalDetails.preferred_contact_method,
        current_location: rentalPreferences.current_location,
        user_application_profile: {
            ...(user.user_application_profile ?? null),
            preferred_locality: rentalPreferences.preferred_locality,
            max_budget_per_week: rentalPreferences.max_budget_per_week,
            has_pets: rentalPreferences.has_pets,
            smoker: rentalPreferences.smoker,
        } as UserProfile["user_application_profile"],
    };

    const combinedUserDetails = {
        ...incomeDetails,
        ...residency,
        // Include rental prefs too so the completion helper doesn't have to read from user.
        ...rentalPreferences,
    };
    const profileCompletion = calculateProfileCompletion(
        virtualUser,
        combinedUserDetails,
        documents
    );

    return {
        fullName: user.full_name || "",
        username: user.username ?? null,
        email: user.email || "",
        imageUrl: user.image_url ?? null,
        phone: user.phone ?? null,
        nativeLanguage: user.native_language ?? null,

        // Personal details
        dateOfBirth: user.date_of_birth ?? null,
        age: null, // Calculated in ProfileCard component
        gender: user.gender ?? null,
        occupation: user.occupation ?? null,
        bio: user.bio ?? null,

        // Location & preferences
        currentLocation: (user.current_location as { display?: string })?.display || null,
        preferredLocality: user.user_application_profile?.preferred_locality ?? null,
        budget: user.user_application_profile?.max_budget_per_week ?? null,

        // Application profile
        visaStatus: user.user_application_profile?.visa_status ?? null,
        employmentStatus: user.user_application_profile?.employment_status ?? null,
        studentStatus: user.user_application_profile?.student_status ?? null,
        hasPets: user.user_application_profile?.has_pets ?? null,
        smoker: user.user_application_profile?.smoker ?? null,

        // Completion
        completionPercentage: profileCompletion.totalPercentage,
    };
}