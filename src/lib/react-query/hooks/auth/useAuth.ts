import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import type { SignupCredentials, LoginCredentials, User } from "@/types/auth.types";
import { createClient } from "@/lib/supabase/client";

// Query keys for better cache management
export const authKeys = {
    all: ["auth"] as const,
    user: () => [...authKeys.all, "user"] as const,
};

export function useUser() {
    return useQuery<User | null, Error>({
        queryKey: authKeys.user(),
        queryFn: async () => {
            const supabase = createClient();
            const { data, error } = await supabase.auth.getUser();

            // Logged-out is normal
            if (error?.message === "Auth session missing!") return null;
            if (error) throw new Error(error.message);

            const user = data.user;
            if (!user) return null;

            return {
                id: user.id,
                email: user.email ?? "",
                name:
                    (typeof user.user_metadata?.name === "string"
                        ? user.user_metadata.name
                        : undefined) ??
                    user.email?.split("@")[0] ??
                    "User",
                avatar_url:
                    typeof user.user_metadata?.avatar_url === "string"
                        ? user.user_metadata.avatar_url
                        : null,
            };
        },
        // Cache user data for 5 minutes
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });
}

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
            router.replace("/login");
        },
        onError: (error) => {
            console.error("Logout error:", error);
        },
    });
}
