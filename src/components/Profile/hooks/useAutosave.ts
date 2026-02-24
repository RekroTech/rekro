import { useEffect, useRef, useCallback } from "react";
import type { ProfileFormState } from "./useProfileForm";

interface UseAutosaveOptions {
    formState: ProfileFormState;
    hasChanges: boolean;
    onSave: (formState: ProfileFormState) => Promise<void>;
    isSaving: boolean;
    isUploadingImage: boolean;
    isAnyDocumentOperationInProgress: boolean;
    debounceMs?: number;
}

/**
 * Hook for autosaving profile changes with debouncing
 *
 * Features:
 * - Debounces save operations to avoid excessive API calls
 * - Prevents concurrent saves
 * - Handles cleanup on unmount
 * - Queues changes during active saves
 */
export function useAutosave({
    formState,
    hasChanges,
    onSave,
    isSaving,
    isUploadingImage,
    isAnyDocumentOperationInProgress,
    debounceMs = 1500, // 1.5 seconds default
}: UseAutosaveOptions) {
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingSaveRef = useRef(false);
    const lastSavedStateRef = useRef<string>("");

    // Memoize the save function to prevent unnecessary re-renders
    const debouncedSave = useCallback(async () => {
        // Don't save if already saving or uploading
        if (isSaving || isUploadingImage || isAnyDocumentOperationInProgress) {
            pendingSaveRef.current = true;
            return;
        }

        // Don't save if no changes
        if (!hasChanges) {
            return;
        }

        // Check if state actually changed since last save to avoid duplicate saves
        const currentStateSnapshot = JSON.stringify(formState);
        if (currentStateSnapshot === lastSavedStateRef.current) {
            return;
        }

        try {
            await onSave(formState);
            lastSavedStateRef.current = currentStateSnapshot;
            pendingSaveRef.current = false;
        } catch (error) {
            console.error("Autosave failed:", error);
            pendingSaveRef.current = false;
        }
    }, [formState, hasChanges, onSave, isSaving, isUploadingImage, isAnyDocumentOperationInProgress]);

    // Effect to handle debounced autosave
    useEffect(() => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Only set timer if there are changes and not currently saving
        if (hasChanges && !isSaving && !isUploadingImage && !isAnyDocumentOperationInProgress) {
            debounceTimerRef.current = setTimeout(() => {
                debouncedSave();
            }, debounceMs);
        }

        // Cleanup on unmount or dependency change
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [formState, hasChanges, debounceMs, debouncedSave, isSaving, isUploadingImage, isAnyDocumentOperationInProgress]);

    // Effect to handle pending saves after operations complete
    useEffect(() => {
        if (pendingSaveRef.current && !isSaving && !isUploadingImage && !isAnyDocumentOperationInProgress && hasChanges) {
            debouncedSave();
        }
    }, [isSaving, isUploadingImage, isAnyDocumentOperationInProgress, hasChanges, debouncedSave]);

    // Manual trigger for immediate save (if needed)
    const triggerSave = useCallback(async () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        await debouncedSave();
    }, [debouncedSave]);

    return {
        triggerSave,
        isSaving,
    };
}

