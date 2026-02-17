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
     * Update user profile image
     */
    updateProfileImage: async (imageUrl: string): Promise<UserProfile> => {
        const response = await fetch("/api/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_url: imageUrl }),
        });

        if (!response.ok) {
            await handleFetchError(response, "Failed to update profile image");
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

    /**
     * Change user password
     */
    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        const response = await fetch("/api/user/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (!response.ok) {
            await handleFetchError(response, "Failed to change password");
        }
    },

    /**
     * Update privacy settings
     */
    updatePrivacySettings: async (data: {
        discoverable?: boolean;
        share_contact?: boolean;
    }): Promise<UserProfile> => {
        const response = await fetch("/api/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            await handleFetchError(response, "Failed to update privacy settings");
        }

        return (await response.json()) as UserProfile;
    },

    /**
     * Update notification preferences
     */
    updateNotificationPreferences: async (data: {
        notification_preferences?: Record<string, unknown>;
        receive_marketing_email?: boolean;
    }): Promise<UserProfile> => {
        const response = await fetch("/api/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            await handleFetchError(response, "Failed to update notification preferences");
        }

        return (await response.json()) as UserProfile;
    },
};
