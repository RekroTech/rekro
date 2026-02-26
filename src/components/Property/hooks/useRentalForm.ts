import { useState, useCallback, useEffect, useMemo } from "react";
import type { Application, Unit } from "@/types/db";
import { RentalFormData } from "@/components/Property";
import { buildInitialFormData, toFormData } from "@/components/ApplicationForm";

interface UseRentalFormParams {
    selectedUnit: Unit;
    application?: Application;
}

interface UseRentalFormReturn {
    rentalForm: RentalFormData;
    updateRentalForm: (updates: Partial<RentalFormData>) => void;
    resetRentalForm: () => void;
}

/**
 * Custom hook to manage rental form state
 * Handles initialization from existing application or default values
 * Syncs form state when application or selected unit changes
 *
 * @param params - Form initialization parameters
 * @returns Rental form state and update functions
 */
export function useRentalForm({
    selectedUnit,
    application,
}: UseRentalFormParams): UseRentalFormReturn {
    // Initialize form state - recalculated when application or unit changes
    const initialFormData = useMemo(
        () => (application ? toFormData(application) : buildInitialFormData(selectedUnit)),
        [application, selectedUnit]
    );

    const [rentalForm, setRentalForm] = useState<RentalFormData>(initialFormData);

    // Sync form when initial data changes (application loaded/changed or unit changed)
    useEffect(() => {
        setRentalForm(initialFormData);
    }, [initialFormData]);

    // Memoized update function to prevent unnecessary re-renders
    const updateRentalForm = useCallback((updates: Partial<RentalFormData>) => {
        setRentalForm((prev) => ({ ...prev, ...updates }));
    }, []);

    // Reset form to initial state
    const resetRentalForm = useCallback(() => {
        setRentalForm(initialFormData);
    }, [initialFormData]);

    return {
        rentalForm,
        updateRentalForm,
        resetRentalForm,
    };
}
