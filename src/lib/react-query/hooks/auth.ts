import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SessionUser, OtpCredentials } from "@/types/auth.types";

// ============================================================================
// Query Keys
// ============================================================================

export const authKeys = {
    sessionUser: ["session-user"] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetches the current SessionUser (auth identity + role + profile data).
 * Calls Supabase directly - no API route needed!
 */
export function useSessionUser(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: authKeys.sessionUser,
        queryFn: async () => {
            const supabase = createClient();
            const { data, error } = await supabase.auth.getUser();

            if (error || !data.user) return null;

            const { data: userData } = await supabase
                .from("users")
                .select(
                    `
                    id,
                    email,
                    full_name,
                    image_url,
                    username,
                    phone,
                    user_roles!inner(role)
                `
                )
                .eq("id", data.user.id)
                .single();

            if (!userData) return null;

            // Extract role from the joined user_roles table
            const roleData = userData.user_roles as unknown as
                | { role: string }
                | { role: string }[];
            const role = Array.isArray(roleData) ? roleData[0]?.role : roleData?.role;

            return {
                id: userData.id,
                email: userData.email,
                name: userData.full_name,
                image_url: userData.image_url,
                username: userData.username,
                phone: userData.phone,
                role,
            } as SessionUser;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: false,
        enabled: options?.enabled ?? true,
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Logout mutation - calls Supabase directly
 */
export function useLogout() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const supabase = createClient();
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        },
        onSuccess: () => {
            // Clear all cached data
            queryClient.clear();
            router.replace("/");
        },
    });
}

/**
 * Google OAuth login - calls Supabase directly
 */
export function useGoogleLogin() {
    return useMutation({
        mutationFn: async (redirectTo?: string) => {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo || "/"}`,
                },
            });
            if (error) throw error;
        },
    });
}

/**
 * OTP sign-in - uses API route for server-side email validation
 */
export function useSignInWithOtp() {
    return useMutation({
        mutationFn: async (credentials: OtpCredentials) => {
            const response = await fetch("/api/auth/otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to send magic link");
            }

            return response.json();
        },
    });
}

/**
 * Resend OTP - same as sign in (Supabase handles resending)
 */
export function useResendOtp() {
    return useSignInWithOtp();
}

// ============================================================================
// Auth State Synchronization
// ============================================================================

/**
 * Syncs Supabase auth state changes with React Query cache.
 * Call this hook once in your root layout/component.
 */
export function useAuthStateSync() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, _session) => {
            // Invalidate session user cache on auth state changes
            if (
                event === "SIGNED_IN" ||
                event === "SIGNED_OUT" ||
                event === "TOKEN_REFRESHED" ||
                event === "USER_UPDATED"
            ) {
                queryClient.invalidateQueries({ queryKey: authKeys.sessionUser });

                // Force refetch on sign in for immediate UI update
                if (event === "SIGNED_IN" || event === "USER_UPDATED") {
                    queryClient.refetchQueries({ queryKey: authKeys.sessionUser });
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);
}

