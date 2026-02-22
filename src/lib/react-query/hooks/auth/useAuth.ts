import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { createClient } from "@/lib/supabase/client";
import type { AuthSuccess, OtpCredentials } from "@/types/auth.types";
import { useEffect, useState } from "react";

// Query keys for better cache management
export const authKeys = {
    all: ["auth"] as const,
    sessionUser: () => [...authKeys.all, "session-user"] as const,
};

/**
 * Lightweight hook to check if user has an active session
 * Uses Supabase client-side session check (no network call)
 * Use this for auth guards and conditional rendering
 */
export function useSession() {
    const [hasSession, setHasSession] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setHasSession(!!session);
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setHasSession(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    return { hasSession, isLoading };
}


/**
 * Logout mutation hook
 */
export function useLogout() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            await authService.logout();
        },
        onSuccess: () => {
            // Clear all queries on logout
            queryClient.clear();
            router.replace("/");
        },
        onError: (error) => {
            console.error("Logout error:", error);
        },
    });
}

/**
 * Google OAuth login mutation hook
 */
export function useGoogleLogin() {
    return useMutation<void, Error, string | undefined>({
        mutationFn: async (redirectTo) => {
            await authService.loginWithGoogle(redirectTo);
        },
        onError: (error) => {
            console.error("Google login error:", error);
        },
    });
}

/**
 * Passwordless OTP sign-in mutation hook
 * Works for both new and existing users
 */
export function useSignInWithOtp() {
    return useMutation<AuthSuccess, Error, OtpCredentials>({
        mutationFn: async (credentials) => {
            return await authService.signInWithOtp(credentials);
        },
        onError: (error) => {
            console.error("OTP sign-in error:", error);
        },
    });
}

/**
 * Resend OTP mutation hook
 * Same as signInWithOtp - Supabase allows resending by calling signInWithOtp again
 */
export function useResendOtp() {
    return useMutation<AuthSuccess, Error, OtpCredentials>({
        mutationFn: async (credentials) => {
            return await authService.resendOtp(credentials);
        },
        onError: (error) => {
            console.error("Resend OTP error:", error);
        },
    });
}
