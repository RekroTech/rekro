import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { UpdateProfile, UserProfile } from "@/types/user.types";

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
        refetchOnMount: false,
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
 * Optimistically updates the cache and refetches in the background
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation<UserProfile, Error, UpdateProfile, UpdateProfileContext>({
        mutationFn: async (data: UpdateProfile) => {
            return await userService.updateProfile(data);
        },
        onMutate: async (newProfile) => {
            // Cancel any outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: userKeys.profile() });

            // Snapshot the previous value
            const previousUser =
                queryClient.getQueryData<UserProfile | null>(userKeys.profile()) ?? null;

            // Optimistically update to the new value
            if (previousUser) {
                queryClient.setQueryData<UserProfile>(userKeys.profile(), {
                    ...previousUser,
                    ...newProfile,
                });
            }

            // Return context with previous value
            return { previousUser };
        },
        onSuccess: (updatedUser) => {
            // Update cache with server response
            queryClient.setQueryData(userKeys.profile(), updatedUser);
        },
        onError: (error, _newProfile, context) => {
            // Rollback on error
            if (context?.previousUser) {
                queryClient.setQueryData(userKeys.profile(), context.previousUser);
            }
            console.error("Failed to update profile:", error);
        },
        onSettled: () => {
            // Always refetch after error or success to ensure sync with server
            queryClient.invalidateQueries({ queryKey: userKeys.profile() });
        },
    });
}
