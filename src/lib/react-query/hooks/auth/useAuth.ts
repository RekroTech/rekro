import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { createClient } from "@/lib/supabase/client";
import type { SignupCredentials, LoginCredentials } from "@/types/auth.types";
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
 * Signup mutation hook
 */
export function useSignup() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation<void, Error, SignupCredentials>({
        mutationFn: async (credentials) => {
            await authService.signup(credentials);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.sessionUser() });
            router.replace("/");
        },
        onError: (error) => {
            console.error("Signup error:", error);
        },
    });
}

/**
 * Login mutation hook
 */
export function useLogin() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation<void, Error, LoginCredentials>({
        mutationFn: async (credentials) => {
            await authService.login(credentials);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.sessionUser() });
            router.replace("/");
        },
        onError: (error) => {
            console.error("Login error:", error);
        },
    });
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
