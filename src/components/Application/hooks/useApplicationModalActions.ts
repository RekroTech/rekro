import { useCallback, useEffect, useMemo } from "react";
import equal from "fast-deep-equal";
import { useRouter } from "next/navigation";
import {
    useUpsertApplication,
    useCreateSnapshot,
} from "@/lib/react-query/hooks/application/useApplications";
import { useToast } from "@/hooks/useToast";
import type { Property } from "@/types/property.types";
import type { Unit, ApplicationType, Application } from "@/types/db";
import type { RentalFormData } from "@/components/Property/types";
import { ModalActionState, ModalStep } from "@/components/Application/types";

interface UseApplicationModalActionsParams {
    property: Property;
    selectedUnit: Unit;
    totalWeeklyRent: number;
    onClose: () => void;
    // Prop drilled state
    rentalForm: RentalFormData;
    step: ModalStep;
    setStep: (step: ModalStep) => void;
    existingApplication?: Application | null;
    setModalActionState: (state: ModalActionState | null) => void;
}

export function useApplicationModalActions({
    property,
    selectedUnit,
    totalWeeklyRent,
    onClose,
    rentalForm,
    step,
    setStep,
    existingApplication,
    setModalActionState,
}: UseApplicationModalActionsParams) {
    const { showToast } = useToast();
    const router = useRouter();

    // Mutations
    const upsertApplicationMutation = useUpsertApplication();
    const createSnapshotMutation = useCreateSnapshot();

    // Detect if form has changes by comparing individual fields
    const hasChanges = useMemo(() => {
        // If no existing application, this is a new application - always needs to be saved
        if (!existingApplication) return true;

        // Compare each field individually, normalizing empty strings to null where appropriate
        const formProposedRent = rentalForm.proposedRent
            ? parseFloat(rentalForm.proposedRent)
            : null;

        // Treat empty string and null as equivalent for optional string fields
        const normalizedFormMoveInDate = rentalForm.moveInDate || null;
        const normalizedExistingMoveInDate = existingApplication.move_in_date || null;
        const moveInDateChanged = normalizedFormMoveInDate !== normalizedExistingMoveInDate;

        const rentalDurationChanged =
            rentalForm.rentalDuration !== existingApplication.rental_duration;
        const proposedRentChanged = formProposedRent !== existingApplication.proposed_rent;
        const totalRentChanged = totalWeeklyRent !== existingApplication.total_rent;
        const inclusionsChanged = !equal(rentalForm.inclusions, existingApplication.inclusions);
        const occupancyTypeChanged =
            rentalForm.occupancyType !== existingApplication.occupancy_type;

        // Treat empty string and null as equivalent for message field
        const normalizedFormMessage = rentalForm.message || null;
        const normalizedExistingMessage = existingApplication.message || null;
        const messageChanged = normalizedFormMessage !== normalizedExistingMessage;

        return (
            moveInDateChanged ||
            rentalDurationChanged ||
            proposedRentChanged ||
            totalRentChanged ||
            inclusionsChanged ||
            occupancyTypeChanged ||
            messageChanged
        );
    }, [existingApplication, rentalForm, totalWeeklyRent]);

    const upsertPayload = useMemo(
        () => ({
            applicationId: existingApplication?.id,
            propertyId: property.id,
            unitId: selectedUnit?.id || null,
            applicationType: (selectedUnit.listing_type === "entire_home"
                ? "group"
                : "individual") as ApplicationType,
            moveInDate: rentalForm.moveInDate,
            rentalDuration: rentalForm.rentalDuration.toString(),
            proposedRent: rentalForm.proposedRent,
            totalRent: totalWeeklyRent,
            inclusions: rentalForm.inclusions,
            occupancyType: rentalForm.occupancyType,
            message: rentalForm.message,
        }),
        [
            existingApplication?.id,
            property.id,
            selectedUnit?.id,
            selectedUnit.listing_type,
            rentalForm,
            totalWeeklyRent,
        ]
    );

    // Application form submit handler - save or update application
    const handleFormSubmit = useCallback(async () => {
        // If updating and no changes, just continue
        if (!hasChanges) {
            setStep("review");
            return;
        }

        try {
            await upsertApplicationMutation.mutateAsync(upsertPayload);
            setStep("review");
        } catch (error) {
            console.error("Application save failed:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to save application. Please try again.";
            showToast(errorMessage, "error");
        }
    }, [hasChanges, setStep, upsertApplicationMutation, upsertPayload, showToast]);

    // Review submit handler - save application snapshot
    const handleReviewSubmit = useCallback(async () => {
        if (!existingApplication) {
            console.error("No application ID provided - cannot create snapshot");
            showToast("Application must be saved before submitting", "error");
            return;
        }

        try {
            await createSnapshotMutation.mutateAsync({
                applicationId: existingApplication?.id,
                note: "Application submitted",
            });

            showToast("Application submitted successfully!", "success");
            setStep("confirm");
        } catch (error) {
            console.error("Application submission failed:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to submit application. Please try again.";
            showToast(errorMessage, "error");
        }
    }, [existingApplication, createSnapshotMutation, showToast, setStep]);

    // Sync action state with modal based on current step
    useEffect(() => {
        if (step === "application") {
            let buttonText = "Save & Continue";
            if (existingApplication?.id) {
                buttonText = hasChanges ? "Update & Continue" : "Continue";
            }

            setModalActionState({
                onSubmit: handleFormSubmit,
                isSubmitting: upsertApplicationMutation.isPending,
                canSubmit: true,
                submitText: buttonText,
                onCancel: onClose,
            });
        } else if (step === "review") {
            setModalActionState({
                onSubmit: handleReviewSubmit,
                isSubmitting: createSnapshotMutation.isPending,
                canSubmit: Boolean(existingApplication?.id),
                submitText: "Submit Application",
                onBack: () => setStep("application"),
                onCancel: onClose,
            });
        } else if (step === "confirm") {
            // redirect to my appllications page
            setModalActionState({
                onSubmit: async () => {
                    router.push("/applications");
                },
                isSubmitting: false,
                canSubmit: true,
                submitText: "My Applications",
                onCancel: onClose,
            });
        }
        // Note: handleFormSubmit and handleReviewSubmit are intentionally excluded from deps
        // to prevent infinite render loops. They are stable via useCallback.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        step,
        existingApplication,
        hasChanges,
        upsertApplicationMutation.isPending,
        createSnapshotMutation.isPending,
        setModalActionState,
        onClose,
        setStep,
    ]);
}
