import { useCallback } from "react";
import { useUpdateProfile } from "@/lib/react-query/hooks/user";
import type { UpdateProfile } from "@/types/user.types";
import type { ProfileFormState } from "./useProfileForm";

/**
 * Transform form state to API update payload
 */
function transformToUpdatePayload(formState: ProfileFormState): UpdateProfile {
    const { personalDetails, residency, incomeDetails, rentalPreferences, additionalDocuments } =
        formState;

    // Build a canonical documents map from the section-level sources.
    // This ensures removals (key deletions) are preserved when saving.
    const allDocuments = {
        ...additionalDocuments, // drivingLicense, referenceLetter, guarantorLetter
        ...residency.documents, // passport, visa
        ...incomeDetails.documents, // payslips, bankStatement, etc.
    };

    return {
        full_name: personalDetails.full_name.trim() || null,
        username: personalDetails.username.trim() || null,
        phone: personalDetails.phone.trim() || null,
        bio: personalDetails.bio.trim() || null,
        occupation: personalDetails.occupation.trim() || null,
        date_of_birth: personalDetails.date_of_birth || null,
        gender: personalDetails.gender || undefined,
        preferred_contact_method: personalDetails.preferred_contact_method,
        native_language: personalDetails.native_language.trim() || null,
        current_location: rentalPreferences.current_location,
        preferred_locality: rentalPreferences.preferred_locality ?? null,
        max_budget_per_week: rentalPreferences.max_budget_per_week,
        has_pets: rentalPreferences.has_pets,
        smoker: rentalPreferences.smoker,
        visa_status: residency.visaStatus,
        employment_status: incomeDetails.employmentStatus,
        employment_type: incomeDetails.employmentType,
        income_source: incomeDetails.incomeSource,
        income_frequency: incomeDetails.incomeFrequency,
        income_amount: incomeDetails.incomeAmount,
        finance_support_type: incomeDetails.financeSupportType,
        finance_support_details: incomeDetails.financeSupportDetails,
        student_status: incomeDetails.studentStatus,
        documents: allDocuments,
    };
}

interface UseProfileSaveOptions {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export function useProfileSave(options?: UseProfileSaveOptions) {
    const { mutate: updateProfile, mutateAsync: updateProfileAsync, isPending } = useUpdateProfile();

    const saveProfile = useCallback(
        (formState: ProfileFormState) => {
            const payload = transformToUpdatePayload(formState);
            updateProfile(payload, {
                onSuccess: () => options?.onSuccess?.("Profile updated successfully!"),
                onError: (error: Error) =>
                    options?.onError?.(`Failed to update profile: ${error.message}`),
            });
        },
        [updateProfile, options]
    );

    const saveProfileAsync = useCallback(
        async (formState: ProfileFormState) => {
            const payload = transformToUpdatePayload(formState);
            await updateProfileAsync(payload);
            options?.onSuccess?.("Profile updated successfully!");
        },
        [updateProfileAsync, options]
    );

    const savePersonalDetailsOnly = useCallback(
        (formState: ProfileFormState) => {
            const { personalDetails } = formState;
            updateProfile(
                {
                    full_name: personalDetails.full_name.trim() || null,
                    username: personalDetails.username.trim() || null,
                    phone: personalDetails.phone.trim() || null,
                    bio: personalDetails.bio.trim() || null,
                    occupation: personalDetails.occupation.trim() || null,
                    date_of_birth: personalDetails.date_of_birth || null,
                    gender: personalDetails.gender || undefined,
                    preferred_contact_method: personalDetails.preferred_contact_method,
                    native_language: personalDetails.native_language.trim() || null,
                },
                {
                    onSuccess: () => options?.onSuccess?.("Personal details updated successfully!"),
                    onError: (error: Error) =>
                        options?.onError?.(`Failed to update: ${error.message}`),
                }
            );
        },
        [updateProfile, options]
    );

    const savePersonalDetailsOnlyAsync = useCallback(
        async (formState: ProfileFormState) => {
            const { personalDetails } = formState;
            await updateProfileAsync({
                full_name: personalDetails.full_name.trim() || null,
                username: personalDetails.username.trim() || null,
                phone: personalDetails.phone.trim() || null,
                bio: personalDetails.bio.trim() || null,
                occupation: personalDetails.occupation.trim() || null,
                date_of_birth: personalDetails.date_of_birth || null,
                gender: personalDetails.gender || undefined,
                preferred_contact_method: personalDetails.preferred_contact_method,
                native_language: personalDetails.native_language.trim() || null,
            });
            options?.onSuccess?.("Personal details updated successfully!");
        },
        [updateProfileAsync, options]
    );

    return {
        saveProfile,
        savePersonalDetailsOnly,
        saveProfileAsync,
        savePersonalDetailsOnlyAsync,
        isSaving: isPending,
    };
}
