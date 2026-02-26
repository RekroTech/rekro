"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useProfile } from "@/lib/hooks/user";
import { calculateProfileCompletion } from "@/components/Profile/profile-completion";
import type { ProfileCompletion } from "@/types/user.types";
import type { Documents } from "@/types/db";
import type { ProfileCompletionDetails } from "@/components/Profile";

interface ProfileCompletionContextValue {
    /** Current profile completion data */
    completion: ProfileCompletion | null;
    /** Whether the profile is 100% complete */
    isComplete: boolean;
    /** Whether the profile data is loading */
    isLoading: boolean;
    /** The user's uploaded documents */
    documents: Documents;
    /**
     * Recalculate completion with temporary form state
     * Useful for profile edit forms to show real-time completion updates
     */
    calculateWithFormState: (
        formState: Partial<ProfileCompletionDetails>,
        formDocuments?: Documents
    ) => ProfileCompletion;
    /** Callback when profile reaches 100% completion */
    onProfileComplete?: () => void;
}

const ProfileCompletionContext = createContext<ProfileCompletionContextValue | undefined>(
    undefined
);

interface ProfileCompletionProviderProps {
    children: React.ReactNode;
    /** Optional callback when profile reaches 100% completion */
    onProfileComplete?: () => void;
}

/**
 * ProfileCompletionProvider
 *
 * Global context for tracking user profile completion state.
 * Automatically recalculates when user profile changes.
 *
 * Benefits:
 * - Single source of truth for profile completion
 * - Prevents duplicate calculations across components
 * - Reactive to profile updates via react-query
 * - Supports temporary form state for real-time updates
 *
 * @example
 * // In your app layout or root
 * <ProfileCompletionProvider>
 *   <YourApp />
 * </ProfileCompletionProvider>
 *
 * // In any component
 * const { completion, isComplete } = useProfileCompletion();
 * if (isComplete) {
 *   // Show "Apply Now" button
 * }
 */
export function ProfileCompletionProvider({
    children,
    onProfileComplete,
}: ProfileCompletionProviderProps) {
    const { data: user, isLoading } = useProfile();
    const hasCompletedRef = useRef(false);

    // Extract documents from user profile
    const documents = useMemo(() => {
        if (!user?.user_application_profile?.documents) {
            return {} as Documents;
        }
        return user.user_application_profile.documents as Documents;
    }, [user]);

    // Build profile completion details from persisted user data
    const persistedDetails = useMemo((): ProfileCompletionDetails | null => {
        if (!user) return null;

        const app = user.user_application_profile;

        return {
            // Residency
            isCitizen: !app?.visa_status,
            visaStatus: app?.visa_status ?? null,

            // Income / study
            employmentStatus: app?.employment_status ?? "working",
            employmentType: app?.employment_type ?? null,
            incomeSource: app?.income_source ?? null,
            incomeFrequency: app?.income_frequency ?? null,
            incomeAmount: app?.income_amount ?? null,
            studentStatus: app?.student_status ?? "not_student",
            financeSupportType: app?.finance_support_type ?? null,
            financeSupportDetails: app?.finance_support_details ?? null,

            // Rental prefs
            max_budget_per_week: app?.max_budget_per_week ?? null,
            preferred_locality: app?.preferred_locality ?? null,
        };
    }, [user]);

    // Calculate completion from persisted data
    const completion = useMemo(() => {
        if (!user || !persistedDetails) return null;
        return calculateProfileCompletion(user, persistedDetails, documents);
    }, [user, persistedDetails, documents]);

    const isComplete = completion?.isComplete ?? false;

    // Trigger callback when profile first reaches 100%
    useEffect(() => {
        if (!completion) return;

        const justCompleted = isComplete && !hasCompletedRef.current;

        if (justCompleted) {
            hasCompletedRef.current = true;
            onProfileComplete?.();
        }

        // Reset flag if profile becomes incomplete
        if (!isComplete && hasCompletedRef.current) {
            hasCompletedRef.current = false;
        }
    }, [isComplete, completion, onProfileComplete]);

    // Helper to recalculate with temporary form state
    const calculateWithFormState = (
        formState: Partial<ProfileCompletionDetails>,
        formDocuments?: Documents
    ): ProfileCompletion => {
        if (!user || !persistedDetails) {
            // Return empty completion if no user
            return {
                totalPercentage: 0,
                sections: [],
                unlockedBadges: [],
                isComplete: false,
            };
        }

        const mergedDetails = { ...persistedDetails, ...formState };
        const mergedDocuments = formDocuments ?? documents;

        return calculateProfileCompletion(user, mergedDetails, mergedDocuments);
    };

    const value: ProfileCompletionContextValue = {
        completion,
        isComplete,
        isLoading,
        documents,
        calculateWithFormState,
        onProfileComplete,
    };

    return (
        <ProfileCompletionContext.Provider value={value}>
            {children}
        </ProfileCompletionContext.Provider>
    );
}

/**
 * useProfileCompletion hook
 *
 * Access profile completion state from anywhere in the app.
 *
 * @throws Error if used outside ProfileCompletionProvider
 *
 * @example
 * const { completion, isComplete } = useProfileCompletion();
 *
 * if (isComplete) {
 *   return <Button>Apply Now</Button>;
 * } else {
 *   return <Button onClick={() => router.push("/profile")}>Complete Profile</Button>;
 * }
 */
export function useProfileCompletion() {
    const context = useContext(ProfileCompletionContext);

    if (context === undefined) {
        throw new Error(
            "useProfileCompletion must be used within a ProfileCompletionProvider"
        );
    }

    return context;
}

