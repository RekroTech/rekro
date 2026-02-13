import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import type { SignupCredentials, LoginCredentials, User } from "@/types/auth.types";

// Query keys for better cache management
export const authKeys = {
    all: ["auth"] as const,
    user: () => [...authKeys.all, "user"] as const,
};

/**
 * Fetch current user with profile data
 * This is the single source of truth for user data on the client
 */
export function useUser() {
    return useQuery<User | null, Error>({
        queryKey: authKeys.user(),
        queryFn: async () => {
            try {
                // Fetch complete user profile (includes auth + profile + roles)
                return await userService.getProfile();
            } catch (error) {
                // User is not authenticated
                if (error instanceof Error && error.message.includes("Unauthorized")) {
                    return null;
                }
                throw error;
            }
        },
        // Cache user data for 5 minutes
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });
}

/**
 * Convenience hook to check if user is authenticated
 * Returns a boolean indicating authentication status
 */
export function useAuth(): { isAuthenticated: boolean; isLoading: boolean } {
    const { data: user, isLoading } = useUser();
    return { isAuthenticated: !!user, isLoading };
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
            // Invalidate user query to refetch
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
            router.replace("/dashboard");
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
            // Invalidate user query to refetch
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
            router.replace("/dashboard");
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
