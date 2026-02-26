import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { EmailVerificationError } from "@/components/Auth";

/**
 * Hook to handle email verification flow from URL params
 * Processes verification success/error states and manages redirects
 */
export function useEmailVerification() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { verificationError, setVerificationError, isVerified, setIsVerified, openAuthModal } =
        useAuthModal();

    // Get params from URL
    const error = useMemo(() => searchParams.get("error"), [searchParams]);
    const errorCode = useMemo(() => searchParams.get("error_code"), [searchParams]);
    const errorDescription = useMemo(() => searchParams.get("error_description"), [searchParams]);
    const verified = useMemo(() => searchParams.get("verified") === "true", [searchParams]);

    // Parse error from URL params and set it in context
    useEffect(() => {
        if (error || errorCode) {
            const errorInfo = parseVerificationError(error, errorCode, errorDescription);
            setVerificationError(errorInfo);
            // Clear query params from URL
            router.replace("/", { scroll: false });
        }
    }, [error, errorCode, errorDescription, setVerificationError, router]);

    // Handle successful verification - redirect after delay
    useEffect(() => {
        if (verified) {
            setIsVerified(true);
            const timer = setTimeout(() => {
                router.replace("/");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [verified, router, setIsVerified]);

    const handleCloseErrorModal = () => {
        setVerificationError(null);
    };

    const handleTryDifferentEmail = () => {
        setVerificationError(null);
        openAuthModal();
    };

    return {
        verified: isVerified,
        errorInfo: verificationError,
        isErrorModalOpen: !!verificationError,
        handleCloseErrorModal,
        handleTryDifferentEmail,
    };
}

/**
 * Parse verification error from URL parameters
 * Only handles errors that Supabase actually returns in real-world usage
 */
function parseVerificationError(
    error: string | null,
    errorCode: string | null,
    errorDescription: string | null
): EmailVerificationError | null {
    // Most common: Magic link expired (Supabase returns otp_expired or our mapped link_expired)
    if (errorCode === "otp_expired" || errorCode === "link_expired") {
        return {
            title: "Link expired",
            message: "This sign-in link has expired. Links are valid for 1 hour.",
            icon: "info",
            canResend: true,
        };
    }

    // OAuth cancelled or link already used
    if (error === "access_denied") {
        return {
            title: "Access denied",
            message: "Sign-in was cancelled or the link has already been used. Please try again.",
            icon: "info",
            canResend: true,
        };
    }

    // Invalid/malformed link from exchangeCodeForSession failure
    if (errorCode === "invalid_link") {
        return {
            title: "Invalid link",
            message: "This link is invalid or malformed. Please request a new one.",
            icon: "info",
            canResend: true,
        };
    }

    // Fallback for any unexpected errors
    if (error || errorCode) {
        return {
            title: "Something went wrong",
            message: errorDescription || "An error occurred during sign-in. Please try again.",
            icon: "x",
            canResend: true,
        };
    }

    return null;
}

