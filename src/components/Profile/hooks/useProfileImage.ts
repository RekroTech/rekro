import { useState, useCallback } from "react";
import { useUpdateProfile } from "@/lib/react-query/hooks/user";
import { uploadProfileImage } from "@/services/storage.service";

interface UseProfileImageOptions {
    userId: string | null | undefined;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

/**
 * Custom hook for managing profile image uploads
 * Handles the upload process and profile update in a single operation
 *
 * @param options - Configuration options
 * @returns Upload handler and loading state
 */
export function useProfileImage(options: UseProfileImageOptions) {
    const { userId, onSuccess, onError } = options;
    const [isUploading, setIsUploading] = useState(false);
    const { mutateAsync: updateProfileAsync } = useUpdateProfile();

    const uploadImage = useCallback(
        async (file: File) => {
            if (!userId) {
                onError?.("User not authenticated");
                return;
            }

            setIsUploading(true);
            try {
                const result = await uploadProfileImage(file, userId);

                // Await the profile update so the loading state reflects the full operation
                await updateProfileAsync({ image_url: result.url });

                onSuccess?.("Profile image updated successfully!");
            } catch (error) {
                console.error("Failed to upload profile image:", error);
                const message = error instanceof Error ? error.message : "Unknown error";

                // Keep message shape consistent with other areas: one toast call with a readable message
                onError?.(`Failed to upload profile image: ${message}`);
            } finally {
                setIsUploading(false);
            }
        },
        [userId, updateProfileAsync, onSuccess, onError]
    );

    return {
        uploadImage,
        isUploading,
    };
}
