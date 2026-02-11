import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import type { SignupCredentials, LoginCredentials, User, AppRole } from "@/types/auth.types";
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

            // 1. Get auth user (from auth.users)
            const { data, error } = await supabase.auth.getUser();

            // Logged-out is normal
            if (error?.message === "Auth session missing!") return null;
            if (error) throw new Error(error.message);

            const authUser = data.user;
            if (!authUser) return null;

            // 2. Fetch profile data from public.users table with user roles
            const { data: profileData } = await supabase
                .from("users")
                .select(
                    `
                    *,
                    user_roles (
                        role
                    )
                `
                )
                .eq("id", authUser.id)
                .single();

            // Extract roles from the joined data
            const roles =
                (profileData?.user_roles as Array<{ role: string }> | undefined)?.map(
                    (r) => r.role as AppRole
                ) ?? [];

            // 3. Merge auth data with profile data
            // Priority: public.users > user_metadata > auth.users > defaults
            return {
                id: authUser.id,
                email: authUser.email ?? "",
                name:
                    profileData?.full_name ??
                    (typeof authUser.user_metadata?.name === "string"
                        ? authUser.user_metadata.name
                        : undefined) ??
                    authUser.email?.split("@")[0] ??
                    "User",
                phone: profileData?.phone ?? authUser?.phone ?? null,
                roles,
                full_name: profileData?.full_name ?? null,
                image_url: profileData?.image_url ?? null,
                current_location: profileData?.current_location ?? null,
                max_budget_per_week: profileData?.max_budget_per_week ?? null,
                receive_marketing_email: profileData?.receive_marketing_email ?? false,
                created_at: profileData?.created_at ?? undefined,
                updated_at: profileData?.updated_at ?? undefined,
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

/**
 * Convenience hook to check if user is authenticated
 * Returns a boolean indicating authentication status
 */
export function useAuth(): { isAuthenticated: boolean } {
    const { data: user } = useUser();
    return { isAuthenticated: !!user };
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
            router.replace("/");
        },
        onError: (error) => {
            console.error("Logout error:", error);
        },
    });
}
