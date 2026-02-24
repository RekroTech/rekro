import { useEffect, useRef, useCallback } from "react";
import equal from "fast-deep-equal";
import { useDebounce } from "@/hooks";
import { useUpsertApplication } from "@/lib/react-query/hooks/application/useApplications";
import type { Property } from "@/types/property.types";
import type { Unit, ApplicationType, Application } from "@/types/db";
import type { RentalFormData } from "@/components/Property/types";

interface UseAutoSaveParams {
    property: Property;
    selectedUnit: Unit;
    totalWeeklyRent: number;
    rentalForm: RentalFormData;
    existingApplication?: Application | null;
    enabled?: boolean; // Allow disabling autosave (e.g., when on review step)
}

/**
 * Hook that automatically saves application form data with debouncing
 * Implements best practices:
 * - Debounces changes to avoid excessive API calls
 * - Only saves when there are actual changes
 * - Uses memoization to prevent unnecessary comparisons
 * - Silent saves without user intervention
 */
export function useAutoSave({
    property,
    selectedUnit,
    totalWeeklyRent,
    rentalForm,
    existingApplication,
    enabled = true,
}: UseAutoSaveParams) {
    const upsertApplicationMutation = useUpsertApplication();

    // Track the last saved form data to avoid redundant saves
    const lastSavedDataRef = useRef<RentalFormData | null>(null);

    // Debounce the form data (wait 1 second after user stops typing)
    const debouncedFormData = useDebounce(rentalForm, 1000);

    // Check if form data has changed from last saved state
    const hasChanges = useCallback(() => {
        if (!lastSavedDataRef.current) {
            // First time - need to save if there's any data
            return Boolean(debouncedFormData.moveInDate);
        }

        // Deep compare to detect actual changes
        return !equal(lastSavedDataRef.current, debouncedFormData);
    }, [debouncedFormData]);

    // Auto-save effect
    useEffect(() => {
        // Don't auto-save if disabled or mutation is pending
        if (!enabled || upsertApplicationMutation.isPending) {
            return;
        }

        // Don't save if there are no changes
        if (!hasChanges()) {
            return;
        }

        // Don't save if required fields are missing
        if (!debouncedFormData.moveInDate) {
            return;
        }

        // Prepare the payload
        const payload = {
            applicationId: existingApplication?.id,
            propertyId: property.id,
            unitId: selectedUnit?.id || null,
            applicationType: (selectedUnit.listing_type === "entire_home"
                ? "group"
                : "individual") as ApplicationType,
            moveInDate: debouncedFormData.moveInDate,
            rentalDuration: debouncedFormData.rentalDuration.toString(),
            proposedRent: debouncedFormData.proposedRent,
            totalRent: totalWeeklyRent,
            inclusions: debouncedFormData.inclusions,
            occupancyType: debouncedFormData.occupancyType,
            message: debouncedFormData.message,
        };

        // Perform silent auto-save
        upsertApplicationMutation.mutate(payload, {
            onSuccess: () => {
                // Update the reference to track what we just saved
                lastSavedDataRef.current = { ...debouncedFormData };
                console.log("Application auto-saved");
            },
            onError: (error) => {
                // Silent failure - don't interrupt user
                console.error("Auto-save failed:", error);
            },
        });
    }, [
        debouncedFormData,
        enabled,
        existingApplication?.id,
        property.id,
        selectedUnit?.id,
        selectedUnit.listing_type,
        totalWeeklyRent,
        hasChanges,
        upsertApplicationMutation,
    ]);

    return {
        isSaving: upsertApplicationMutation.isPending,
    };
}

