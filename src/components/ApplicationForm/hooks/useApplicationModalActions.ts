import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    useUpsertApplication,
    useCreateSnapshot,
    useSubmitApplication,
} from "@/lib/hooks/application";
import { useToast } from "@/hooks/useToast";
import type { Application, ApplicationType, Unit } from "@/types/db";
import type { Property } from "@/types/property.types";
import type { RentalFormData } from "@/components/Property";
import { ModalActionState, ModalStep } from "../types";

interface UseApplicationModalActionsParams {
    property: Property;
    selectedUnit: Unit;
    onClose: () => void;
    // Prop drilled state
    rentalForm: RentalFormData;
    step: ModalStep;
    setStep: (step: ModalStep) => void;
    existingApplication?: Application | null;
}

export function useApplicationModalActions({
    property,
    selectedUnit,
    onClose,
    rentalForm,
    step,
    setStep,
    existingApplication,
}: UseApplicationModalActionsParams) {
    const { showToast } = useToast();
    const router = useRouter();
    const [modalActionState, setModalActionState] = useState<ModalActionState | null>(null);

    // Mutations
    const upsertApplicationMutation = useUpsertApplication();
    const createSnapshotMutation = useCreateSnapshot();
    const submitApplicationMutation = useSubmitApplication();


    // Form submit handler - save application and proceed to review
    const handleFormSubmit = useCallback(async () => {
        // Validate required fields
        if (!rentalForm.moveInDate) {
            showToast("Please select a move-in date", "error");
            return;
        }

        try {
            const payload = {
                applicationId: existingApplication?.id,
                propertyId: property.id,
                unitId: selectedUnit?.id || null,
                applicationType: (selectedUnit.listing_type === "entire_home"
                    ? "group"
                    : "individual") as ApplicationType,
                moveInDate: rentalForm.moveInDate,
                rentalDuration: rentalForm.rentalDuration.toString(),
                proposedRent: rentalForm.proposedRent,
                totalRent: rentalForm.totalRent,
                inclusions: rentalForm.inclusions,
                occupancyType: rentalForm.occupancyType,
                message: rentalForm.message,
            };

            await upsertApplicationMutation.mutateAsync(payload);
            showToast("Application saved successfully", "success");
            setStep("review");
        } catch (error) {
            console.error("Failed to save application:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to save application. Please try again.";
            showToast(errorMessage, "error");
        }
    }, [
        existingApplication?.id,
        property.id,
        selectedUnit?.id,
        selectedUnit.listing_type,
        rentalForm,
        upsertApplicationMutation,
        showToast,
        setStep,
    ]);

    // Review submit handler - submit application and save snapshot
    const handleReviewSubmit = useCallback(async () => {
        if (!existingApplication) {
            console.error("No application ID provided - cannot submit application");
            showToast("Application must be saved before submitting", "error");
            return;
        }

        try {
            // First, update the application status to "submitted"
            await submitApplicationMutation.mutateAsync(existingApplication.id);

            // Then create a snapshot
            await createSnapshotMutation.mutateAsync({
                applicationId: existingApplication.id,
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
    }, [existingApplication, submitApplicationMutation, createSnapshotMutation, showToast, setStep]);

    // Sync action state with modal based on current step
    useEffect(() => {
        if (step === "application") {
            // Save application on Continue click
            setModalActionState({
                onSubmit: handleFormSubmit,
                isSubmitting: upsertApplicationMutation.isPending,
                canSubmit: Boolean(rentalForm.moveInDate),
                submitText: "Continue",
                onCancel: onClose,
            });
        } else if (step === "review") {
            setModalActionState({
                onSubmit: handleReviewSubmit,
                isSubmitting: submitApplicationMutation.isPending || createSnapshotMutation.isPending,
                canSubmit: Boolean(existingApplication?.id),
                submitText: "Submit Application",
                onBack: () => setStep("application"),
                onCancel: onClose,
            });
        } else if (step === "confirm") {
            // redirect to my applications page
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
        rentalForm.moveInDate,
        upsertApplicationMutation.isPending,
        submitApplicationMutation.isPending,
        createSnapshotMutation.isPending,
        setModalActionState,
        onClose,
        setStep,
    ]);

    return { modalActionState };
}
