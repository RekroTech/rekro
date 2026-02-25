import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, UpdateProfile } from "@/types/user.types";
import { authKeys } from "./auth";
import { CACHE_STRATEGIES } from "@/lib/react-query/config";
import { propertyKeys } from "@/lib/react-query/hooks/property";

// ============================================================================
// Query Keys
// ============================================================================

export const userKeys = {
    all: ["user"] as const,
    profile: () => [...userKeys.all, "profile"] as const,
    likedUsers: (propertyId: string) =>
        [...propertyKeys.detail(propertyId), "liked-users"] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetches full user profile (users + user_application_profile)
 * Calls Supabase directly - no API route needed for reads!
 */
export function useProfile(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: userKeys.profile(),
        queryFn: async () => {
            const supabase = createClient();
            const {
                data: { user: authUser },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !authUser) return null;

            const { data, error } = await supabase
                .from("users")
                .select(
                    `
                    *,
                    user_application_profile (
                        *
                    )
                `
                )
                .eq("id", authUser.id)
                .single<UserProfile>();

            if (error) {
                console.error("Profile fetch error:", error);
                return null;
            }

            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - user profiles don't change often
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
        enabled: options?.enabled ?? true,
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Update user profile - uses API route for server-side validation
 * The API handles splitting data between users and user_application_profile tables
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateProfile) => {
            const response = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: "Failed to update profile" }));
                throw new Error(error.error || "Failed to update profile");
            }

            return (await response.json()) as UserProfile;
        },
        onMutate: async () => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: userKeys.profile() });

            // Snapshot for rollback
            const previousProfile = queryClient.getQueryData<UserProfile | null>(
                userKeys.profile()
            );

            return { previousProfile };
        },
        onSuccess: (updatedProfile) => {
            // Update cache with server response
            queryClient.setQueryData(userKeys.profile(), updatedProfile);
            // Invalidate session user to update name/image in navbar
            queryClient.invalidateQueries({ queryKey: authKeys.sessionUser });
        },
        onError: (_error, _variables, context) => {
            // Rollback on error
            if (context?.previousProfile) {
                queryClient.setQueryData(userKeys.profile(), context.previousProfile);
            }
        },
    });
}

/**
 * Hook to fetch users who liked any unit in a property
 * Uses the liked_profiles view
 */
export function useUserLikes(propertyId: string) {
    return useQuery({
        queryKey: userKeys.likedUsers(propertyId),
        queryFn: async () => {
            const supabase = createClient();

            const { data: likedProfiles, error } = await supabase
                .from("liked_profiles")
                .select("*")
                .eq("property_id", propertyId);

            if (error) {
                console.error("Error fetching users who liked property:", error);
                throw new Error(error.message);
            }

            return likedProfiles || [];
        },
        enabled: !!propertyId,
        ...CACHE_STRATEGIES.USER_SPECIFIC,
    });
}

