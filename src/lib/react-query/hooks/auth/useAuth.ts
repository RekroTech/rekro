import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { createClient } from "@/lib/supabase/client";
import type { AuthSuccess, OtpCredentials } from "@/types/auth.types";
import { useEffect, useState } from "react";
import { userKeys } from "@/lib/react-query/hooks/user/useProfile";

// Query keys for better cache management
export const authKeys = {
    all: ["auth"] as const,
    sessionUser: () => [...authKeys.all, "session-user"] as const,
};

/**
 * Lightweight hook that keeps React Query auth-derived caches in sync
 * with Supabase client auth state.
 *
 * - No network call by default.
 * - Triggers refetch of server-derived session user when auth state changes.
 */
export function useSession() {
    const [hasSession, setHasSession] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setHasSession(!!session);
            setIsLoading(false);

            // Keep server-derived session user in sync with client auth events
            if (
                event === "SIGNED_IN" ||
                event === "SIGNED_OUT" ||
                event === "TOKEN_REFRESHED" ||
                event === "USER_UPDATED"
            ) {
                queryClient.invalidateQueries({ queryKey: authKeys.sessionUser() });
                queryClient.invalidateQueries({ queryKey: userKeys.profile() });

                // Force immediate refetch on sign in/user update so the header updates ASAP.
                if (event === "SIGNED_IN" || event === "USER_UPDATED") {
                    queryClient.refetchQueries({ queryKey: authKeys.sessionUser() });
                }
            }
        });

        // Initial session check (client-side) to seed hasSession and ensure we fetch session user.
        supabase.auth
            .getSession()
            .then(({ data: { session } }) => {
                setHasSession(!!session);
                setIsLoading(false);

                if (session) {
                    queryClient.invalidateQueries({ queryKey: authKeys.sessionUser() });
                }
            })
            .catch(() => {
                setHasSession(false);
                setIsLoading(false);
            });

        return () => subscription.unsubscribe();
    }, [queryClient]);

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
