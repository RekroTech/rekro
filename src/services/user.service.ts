import type {
    Gender,
    PreferredContactMethod,
    User,
    UserLocation,
    NotificationPreferences,
} from "@/types/auth.types";
import { handleFetchError } from "@/lib/utils/api-error";

export interface UpdateProfileData {
    full_name?: string | null;
    username?: string | null;
    phone?: string | null;
    image_url?: string | null;

    current_location?: UserLocation | null;
    destination_location?: UserLocation | null;

    study_field?: string | null;
    study_level?: string | null;
    university?: string | null;
    languages?: string[] | null;

    max_budget_per_week?: number | null;
    receive_marketing_email?: boolean;

    date_of_birth?: string | null;
    gender?: Gender | null;
    occupation?: string | null;
    bio?: string | null;

    preferred_contact_method?: PreferredContactMethod;
    notification_preferences?: NotificationPreferences | null;
}

export const userService = {
    /**
     * Update user profile
     */
    updateProfile: async (data: UpdateProfileData): Promise<User> => {
        const response = await fetch("/api/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            await handleFetchError(response, "Failed to update profile");
        }

        return (await response.json()) as User;
    },

    /**
     * Get user profile
     */
    getProfile: async (): Promise<User> => {
        const response = await fetch("/api/user/profile");

        if (!response.ok) {
            await handleFetchError(response, "Failed to fetch profile");
        }

        return (await response.json()) as User;
    },
};
