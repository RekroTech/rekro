import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/lib/react-query/hooks/auth/useAuth";
import type { User } from "@/types/auth.types";
import { userService, type UpdateProfileData } from "@/services/user.service";

/**
 * Context type for the mutation
 */
interface UpdateProfileContext {
    previousUser: User | null;
}

/**
 * Hook to update user profile
 * Optimistically updates the cache and refetches in the background
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation<User, Error, UpdateProfileData, UpdateProfileContext>({
        mutationFn: async (data: UpdateProfileData) => {
            return await userService.updateProfile(data);
        },
        onMutate: async (newProfile) => {
            // Cancel any outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: authKeys.user() });

            // Snapshot the previous value
            const previousUser = queryClient.getQueryData<User | null>(authKeys.user()) ?? null;

            // Optimistically update to the new value
            if (previousUser) {
                queryClient.setQueryData<User>(authKeys.user(), {
                    ...previousUser,
                    ...newProfile,
                });
            }

            // Return context with previous value
            return { previousUser };
        },
        onSuccess: (updatedUser) => {
            // Update cache with server response
            queryClient.setQueryData(authKeys.user(), updatedUser);
        },
        onError: (error, _newProfile, context) => {
            // Rollback on error
            if (context?.previousUser) {
                queryClient.setQueryData(authKeys.user(), context.previousUser);
            }
            console.error("Failed to update profile:", error);
        },
        onSettled: () => {
            // Always refetch after error or success to ensure sync with server
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
        },
    });
}
