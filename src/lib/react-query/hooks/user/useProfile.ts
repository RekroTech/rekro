import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { UpdateProfile, UserProfile } from "@/types/user.types";
import { authKeys } from "@/lib/react-query/hooks/auth";

export const userKeys = {
    all: ["user"] as const,
    profile: () => [...userKeys.all, "profile"] as const,
};

/**
 * Hook to fetch user profile
 * Only fetches when enabled (typically when user has an active session)
 *
 * @param options - Optional configuration
 * @param options.enabled - Whether to enable the query (default: true)
 */
export function useProfile(options?: { enabled?: boolean }) {
    return useQuery<UserProfile | null, Error>({
        queryKey: userKeys.profile(),
        queryFn: async () => {
            try {
                return await userService.getProfile();
            } catch (error) {
                // User is not authenticated
                if (error instanceof Error && error.message.includes("Unauthorized")) {
                    return null;
                }
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true, // Refetch on component mount to ensure fresh data after auth
        retry: false,
        enabled: options?.enabled ?? true,
    });
}

/**
 * Context type for the mutation
 */
interface UpdateProfileContext {
    previousUser: UserProfile | null;
}

/**
 * Hook to update user profile
 * The server handles merging profile and application profile fields,
 * so we just rely on the response for cache updates.
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation<UserProfile, Error, UpdateProfile, UpdateProfileContext>({
        mutationFn: async (data: UpdateProfile) => {
            return await userService.updateProfile(data);
        },
        onMutate: async () => {
            // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: userKeys.profile() });

            // Snapshot the previous value for rollback
            const previousUser =
                queryClient.getQueryData<UserProfile | null>(userKeys.profile()) ?? null;

            return { previousUser };
        },
        onSuccess: (updatedUser) => {
            // Update cache with the server response (which has the correct structure)
            queryClient.setQueryData(userKeys.profile(), updatedUser);
            queryClient.invalidateQueries({ queryKey: authKeys.sessionUser });
        },
        onError: (error, _newProfile, context) => {
            // Rollback to previous state on error
            if (context?.previousUser) {
                queryClient.setQueryData(userKeys.profile(), context.previousUser);
            }
            console.error("Failed to update profile:", error);
        },
    });
}
