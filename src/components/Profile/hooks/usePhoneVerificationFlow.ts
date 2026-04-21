import { useCallback, useState } from "react";
import { validateAUPhone } from "@/lib/utils";
import { toCanonicalPhoneDigits } from "@/lib/utils/phone";

/**
 * Phone verification snapshot for optimistic updates
 */
type PhoneVerificationSnapshot = {
    phone: string;
    verifiedAt: string;
};

/**
 * View model returned by the hook for section components
 */
export interface PhoneVerificationViewmodel {
    /** Whether the current phone matches verified state */
    isVerified: boolean;
    /** ISO timestamp when phone was verified (null if not verified) */
    verifiedAt: string | null;
    /** Whether the current phone is a valid AU number */
    isValid: boolean;
    /** Whether the verification modal should auto-open */
    shouldAutoOpen: boolean;
    /** Handles a successful verification result from the modal */
    handleVerified: (payload: { phone: string; verifiedAt: string }) => Promise<void>;
}

export interface PhoneVerificationState {
    isVerified: boolean;
    verifiedAt: string | null;
    isValid: boolean;
    handleVerified: (payload: { phone: string; verifiedAt: string }) => Promise<void>;
}

interface UsePhoneVerificationFlowParams {
    /** Current phone number in form */
    phone: string;
    /** Persisted phone from user data */
    persistedPhone: string | null | undefined;
    /** Persisted verified timestamp from user data */
    persistedPhoneVerifiedAt: string | null | undefined;
    /** Callback when phone is successfully verified */
    onPhoneVerified: (payload: { phone: string; verifiedAt: string }) => void;
}

/**
 * Orchestrates phone verification state and optimistic reconciliation.
 *
 * Owns:
 * - Optimistic verification snapshot reconciliation
 * - Verified/valid derived flags with proper digit canonicalization
 * - Verification status derivation for the current phone value
 *
 * Delegate to sections:
 * - UI state for modal open/close and field-level validation
 *
 * @param params - Configuration and callbacks
 * @returns View model for section components
 */
export function usePhoneVerificationFlow({
    phone,
    persistedPhone,
    persistedPhoneVerifiedAt,
    onPhoneVerified,
}: UsePhoneVerificationFlowParams): PhoneVerificationState {
    const [optimisticSnapshot, setOptimisticSnapshot] = useState<PhoneVerificationSnapshot | null>(null);

    // Compute canonical digits and resolved verification state inline.
    // These are lightweight pure functions; memoization overhead exceeds computation cost.
    const currentPhoneDigits = toCanonicalPhoneDigits(phone);
    const optimisticPhoneDigits = toCanonicalPhoneDigits(optimisticSnapshot?.phone);
    const persistedPhoneDigits = toCanonicalPhoneDigits(persistedPhone);

    // Clear optimistic state once persisted data syncs
    const activeOptimisticSnapshot =
        optimisticSnapshot &&
        !(
            persistedPhoneVerifiedAt &&
            optimisticPhoneDigits &&
            persistedPhoneDigits &&
            optimisticPhoneDigits === persistedPhoneDigits
        )
            ? optimisticSnapshot
            : null;

    // Resolve verified timestamp: optimistic takes priority if digits match current phone, else check persisted
    const verifiedAt =
        currentPhoneDigits && optimisticPhoneDigits && currentPhoneDigits === optimisticPhoneDigits
            ? activeOptimisticSnapshot?.verifiedAt ?? null
            : currentPhoneDigits && persistedPhoneDigits && currentPhoneDigits === persistedPhoneDigits
              ? persistedPhoneVerifiedAt ?? null
              : null;

    const isVerified = Boolean(verifiedAt);
    const isValid = Boolean(phone.trim()) && validateAUPhone(phone);

    // Only memoize callback: it's passed to child and referential identity matters for dependency arrays
    const handleVerified = useCallback(
        async (payload: { phone: string; verifiedAt: string }) => {
            setOptimisticSnapshot({
                phone: payload.phone,
                verifiedAt: payload.verifiedAt,
            });

            await onPhoneVerified(payload);
        },
        [onPhoneVerified]
    );

    return {
        isVerified,
        verifiedAt,
        isValid,
        handleVerified,
    };
}

