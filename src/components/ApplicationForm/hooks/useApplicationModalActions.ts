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

    // Mutations
    const upsertApplicationMutation = useUpsertApplication();
    const createSnapshotMutation = useCreateSnapshot();
    const submitApplicationMutation = useSubmitApplication();

    if (step === "application") {
        const onSubmit = async (): Promise<void> => {
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
                setStep("review");
            } catch (error) {
                console.error("Failed to save application:", error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to save application. Please try again.";
                showToast(errorMessage, "error");
            }
        };

        const modalActionState: ModalActionState = {
            onSubmit,
            isSubmitting: upsertApplicationMutation.isPending,
            canSubmit: Boolean(rentalForm.moveInDate),
            submitText: "Continue",
            onCancel: onClose,
        };

        return { modalActionState };
    }

    if (step === "review") {
        const onSubmit = async (): Promise<void> => {
            if (!existingApplication) {
                console.error("No application ID provided - cannot submit application");
                showToast("Application must be saved before submitting", "error");
                return;
            }

            try {
                await submitApplicationMutation.mutateAsync(existingApplication.id);

                await createSnapshotMutation.mutateAsync({
                    applicationId: existingApplication.id,
                    note: "Application submitted",
                });
                setStep("confirm");
            } catch (error) {
                console.error("Application submission failed:", error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to submit application. Please try again.";
                showToast(errorMessage, "error");
            }
        };

        const modalActionState: ModalActionState = {
            onSubmit,
            isSubmitting: submitApplicationMutation.isPending || createSnapshotMutation.isPending,
            canSubmit: Boolean(existingApplication?.id),
            submitText: "Submit Application",
            onBack: () => setStep("application"),
            onCancel: onClose,
        };

        return { modalActionState };
    }

    if (step === "confirm") {
        const onSubmit = async (): Promise<void> => {
            router.push("/applications");
        };

        const modalActionState: ModalActionState = {
            onSubmit,
            isSubmitting: false,
            canSubmit: true,
            submitText: "My Applications",
            onCancel: onClose,
        };

        return { modalActionState };
    }

    return { modalActionState: null };
}
