import { useEffect, useReducer, useCallback, useMemo, useState } from "react";
import type { UserProfile } from "@/types/user.types";
import type {
    PersonalDetailsFormState,
    ResidencyFormState,
    IncomeDetailsFormState,
    RentalPreferencesFormState,
    AdditionalDocumentsFormState,
} from "@/components/Profile";
import { Documents } from "@/types/db";
import { deepClone } from "@/components/Profile/utils";

/**
 * Complete profile form state
 */
export interface ProfileFormState {
    personalDetails: PersonalDetailsFormState;
    residency: ResidencyFormState;
    incomeDetails: IncomeDetailsFormState;
    rentalPreferences: RentalPreferencesFormState;
    additionalDocuments: AdditionalDocumentsFormState;
    documents: Documents;
}

/**
 * Deep comparison utility for detecting changes
 * Handles nested objects and null/undefined values
 */
function hasChanges(current: ProfileFormState, original: ProfileFormState | undefined): boolean {
    if (!original) return false;

    // Helper to compare two values deeply
    const deepEqual = (a: unknown, b: unknown): boolean => {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a !== typeof b) return false;

        if (typeof a === 'object' && typeof b === 'object') {
            const keysA = Object.keys(a as Record<string, unknown>);
            const keysB = Object.keys(b as Record<string, unknown>);

            if (keysA.length !== keysB.length) return false;

            return keysA.every(key =>
                deepEqual(
                    (a as Record<string, unknown>)[key],
                    (b as Record<string, unknown>)[key]
                )
            );
        }

        return false;
    };

    // Compare each section - if any section is NOT equal, we have changes
    return (
        !deepEqual(current.personalDetails, original.personalDetails) ||
        !deepEqual(current.residency, original.residency) ||
        !deepEqual(current.incomeDetails, original.incomeDetails) ||
        !deepEqual(current.rentalPreferences, original.rentalPreferences) ||
        !deepEqual(current.additionalDocuments, original.additionalDocuments) ||
        !deepEqual(current.documents, original.documents)
    );
}

/**
 * Actions for the profile form reducer
 */
type ProfileFormAction =
    | { type: "SET_PERSONAL_DETAILS"; payload: Partial<PersonalDetailsFormState> }
    | { type: "SET_RESIDENCY"; payload: Partial<ResidencyFormState> }
    | { type: "SET_INCOME_DETAILS"; payload: Partial<IncomeDetailsFormState> }
    | { type: "SET_RENTAL_PREFERENCES"; payload: Partial<RentalPreferencesFormState> }
    | { type: "SET_ADDITIONAL_DOCUMENTS"; payload: Partial<AdditionalDocumentsFormState> }
    | { type: "SET_DOCUMENTS"; payload: Documents }
    | { type: "HYDRATE_FROM_USER"; payload: UserProfile }
    | { type: "RESET" };

/**
 * Initial state factory
 */
function createInitialState(): ProfileFormState {
    return {
        personalDetails: {
            full_name: "",
            username: "",
            phone: "",
            bio: "",
            occupation: "",
            date_of_birth: "",
            gender: "",
            preferred_contact_method: "email",
            native_language: "",
        },
        residency: {
            isCitizen: true,
            visaStatus: null,
            documents: {},
        },
        incomeDetails: {
            employmentStatus: "working",
            employmentType: null,
            incomeSource: null,
            incomeFrequency: null,
            incomeAmount: null,
            studentStatus: "not_student",
            financeSupportType: null,
            financeSupportDetails: null,
            documents: {},
        },
        rentalPreferences: {
            current_location: null,
            destination_location: null,
            max_budget_per_week: null,
            preferred_locality: null,
            has_pets: null,
            smoker: null,
        },
        additionalDocuments: {},
        documents: {} as Documents,
    };
}

/**
 * Transform UserProfile from API to form state
 */
function hydrateFromUser(user: UserProfile): ProfileFormState {
    const app = user.user_application_profile ?? null;
    const allDocs = (app?.documents as Documents) ?? ({} as Documents);

    // Split documents by section
    const residencyDocs = {
        passport: allDocs.passport,
        visa: allDocs.visa,
    };

    const incomeDocs = {
        payslips: allDocs.payslips,
        bankStatement: allDocs.bankStatement,
        employmentLetter: allDocs.employmentLetter,
        studentId: allDocs.studentId,
        coe: allDocs.coe,
        proofOfFunds: allDocs.proofOfFunds,
    };

    const otherDocs = {
        drivingLicense: allDocs.drivingLicense,
        referenceLetter: allDocs.referenceLetter,
        guarantorLetter: allDocs.guarantorLetter,
    };

    return {
        personalDetails: {
            full_name: user.full_name ?? "",
            username: user.username ?? "",
            phone: user.phone ?? "",
            bio: user.bio ?? "",
            occupation: user.occupation ?? "",
            date_of_birth: user.date_of_birth ?? "",
            gender: (user.gender ?? "") as PersonalDetailsFormState["gender"],
            preferred_contact_method: user.preferred_contact_method ?? "email",
            native_language: user.native_language ?? "",
        },
        residency: {
            isCitizen: !app?.visa_status,
            visaStatus: app?.visa_status ?? null,
            documents: residencyDocs,
        },
        incomeDetails: {
            employmentStatus: app?.employment_status ?? "working",
            employmentType: app?.employment_type ?? null,
            incomeSource: app?.income_source ?? null,
            incomeFrequency: app?.income_frequency ?? null,
            incomeAmount: app?.income_amount ?? null,
            studentStatus: app?.student_status ?? "not_student",
            financeSupportType: app?.finance_support_type ?? null,
            financeSupportDetails: app?.finance_support_details ?? null,
            documents: incomeDocs,
        },
        rentalPreferences: {
            current_location: user.current_location ?? null,
            destination_location: null,
            max_budget_per_week: app?.max_budget_per_week ?? null,
            preferred_locality: app?.preferred_locality ?? null,
            has_pets: app?.has_pets ?? null,
            smoker: app?.smoker ?? null,
        },
        additionalDocuments: otherDocs,
        documents: allDocs,
    };
}

/**
 * Profile form reducer
 */
function profileFormReducer(
    state: ProfileFormState,
    action: ProfileFormAction
): ProfileFormState {
    switch (action.type) {
        case "SET_PERSONAL_DETAILS":
            return {
                ...state,
                personalDetails: { ...state.personalDetails, ...action.payload },
            };
        case "SET_RESIDENCY":
            return {
                ...state,
                residency: { ...state.residency, ...action.payload },
            };
        case "SET_INCOME_DETAILS":
            return {
                ...state,
                incomeDetails: { ...state.incomeDetails, ...action.payload },
            };
        case "SET_RENTAL_PREFERENCES":
            return {
                ...state,
                rentalPreferences: { ...state.rentalPreferences, ...action.payload },
            };
        case "SET_ADDITIONAL_DOCUMENTS":
            return {
                ...state,
                additionalDocuments: { ...state.additionalDocuments, ...action.payload },
            };
        case "SET_DOCUMENTS":
            return {
                ...state,
                documents: action.payload,
            };
        case "HYDRATE_FROM_USER":
            return hydrateFromUser(action.payload);
        case "RESET":
            return createInitialState();
        default:
            return state;
    }
}

/**
 * Custom hook for managing profile form state
 * Centralizes all profile-related state management with a reducer pattern
 *
 * @param user - Current user profile from API
 * @returns Form state and update handlers
 */
export function useProfileForm(user: UserProfile | null | undefined) {
    const [state, dispatch] = useReducer(
        profileFormReducer,
        undefined,
        createInitialState
    );

    // Baseline snapshot (last hydrated or last committed after save)
    const [originalState, setOriginalState] = useState<ProfileFormState | null>(null);

    // Hydrate form state from user data on mount or when user changes
    useEffect(() => {
        if (!user) return;

        const hydratedState = hydrateFromUser(user);
        dispatch({ type: "HYDRATE_FROM_USER", payload: user });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOriginalState(deepClone(hydratedState));
    }, [user]);

    // Update handlers
    const updatePersonalDetails = useCallback(
        (payload: Partial<PersonalDetailsFormState>) => {
            dispatch({ type: "SET_PERSONAL_DETAILS", payload });
        },
        []
    );

    const updateResidency = useCallback((payload: Partial<ResidencyFormState>) => {
        dispatch({ type: "SET_RESIDENCY", payload });
    }, []);

    const updateIncomeDetails = useCallback(
        (payload: Partial<IncomeDetailsFormState>) => {
            dispatch({ type: "SET_INCOME_DETAILS", payload });
        },
        []
    );

    const updateRentalPreferences = useCallback(
        (payload: Partial<RentalPreferencesFormState>) => {
            dispatch({ type: "SET_RENTAL_PREFERENCES", payload });
        },
        []
    );

    const updateAdditionalDocuments = useCallback(
        (payload: Partial<AdditionalDocumentsFormState>) => {
            dispatch({ type: "SET_ADDITIONAL_DOCUMENTS", payload });
        },
        []
    );

    const updateDocuments = useCallback((payload: Documents) => {
        dispatch({ type: "SET_DOCUMENTS", payload });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: "RESET" });
    }, []);

    /**
     * Reset editable form state back to the last baseline snapshot.
     * Useful for a Cancel button or after a save error.
     */
    const resetToBaseline = useCallback(() => {
        if (!originalState) return;
        // We hydrate by dispatching HYDRATE_FROM_USER normally, but baseline might be
        // newer than `user` (e.g. after commit). So we just replace via RESET+manual.
        // The reducer doesn't have a SET_ALL action, so we re-hydrate by dispatching
        // section updates.
        dispatch({ type: "RESET" });
        // Apply full baseline in one go by using HYDRATE_FROM_USER shape conversion
        // isn't applicable; instead, rely on direct state set via reducer actions.
        // We keep this minimal: set each slice.
        dispatch({ type: "SET_PERSONAL_DETAILS", payload: originalState.personalDetails });
        dispatch({ type: "SET_RESIDENCY", payload: originalState.residency });
        dispatch({ type: "SET_INCOME_DETAILS", payload: originalState.incomeDetails });
        dispatch({ type: "SET_RENTAL_PREFERENCES", payload: originalState.rentalPreferences });
        dispatch({ type: "SET_ADDITIONAL_DOCUMENTS", payload: originalState.additionalDocuments });
        dispatch({ type: "SET_DOCUMENTS", payload: originalState.documents });
    }, [originalState]);

    /**
     * Commit current state as the new baseline.
     * Call this after a successful save so `hasChanges` flips back to false.
     */
    const commitBaseline = useCallback(() => {
        setOriginalState(deepClone(state));
    }, [state]);

    // Compute if there are any changes from the baseline snapshot
    const hasFormChanges = useMemo(() => {
        if (!originalState) return false;
        return hasChanges(state, originalState);
    }, [state, originalState]);

    return {
        state,
        updatePersonalDetails,
        updateResidency,
        updateIncomeDetails,
        updateRentalPreferences,
        updateAdditionalDocuments,
        updateDocuments,
        reset,
        resetToBaseline,
        commitBaseline,
        hasChanges: hasFormChanges,
    };
}
