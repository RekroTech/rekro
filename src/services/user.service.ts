import { handleFetchError } from "@/lib/utils/api-error";
import { UpdateProfile, UserProfile } from "@/types/user.types";

export const userService = {
    /**
     * Update user profile
     */
    updateProfile: async (data: UpdateProfile): Promise<UserProfile> => {
        const response = await fetch("/api/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            await handleFetchError(response, "Failed to update profile");
        }

        return (await response.json()) as UserProfile;
    },

    /**
     * Get user profile
     */
    getProfile: async (): Promise<UserProfile> => {
        const response = await fetch("/api/user/profile");

        if (!response.ok) {
            await handleFetchError(response, "Failed to fetch profile");
        }

        return (await response.json()) as UserProfile;
    },
};
