"use client";

import React, { useMemo, useCallback } from "react";
import { Modal } from "@/components/common";
import { calculatePricing } from "@/components/Property/pricing";
import { useApplicationModalActions } from "./hooks";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationReview } from "./ApplicationReview/ApplicationReview";
import { ApplicationConfirm } from "./ApplicationConfirm";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import type { ModalButton } from "@/components/common/Modal";
import type { RentalFormData } from "@/components/Property/types";
import { useApplication } from "@/lib/react-query/hooks/application/useApplications";
import { ModalActionState, ModalStep } from "@/components/Application/types";


interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property;
    selectedUnit: Unit;
    rentalForm: RentalFormData;
    updateRentalForm: (updates: Partial<RentalFormData>) => void;
}

export function ApplicationModal({
    isOpen,
    onClose,
    property,
    selectedUnit,
    rentalForm,
    updateRentalForm,
}: ApplicationModalProps) {
    // Modal step state (managed locally)
    const [step, setStep] = React.useState<ModalStep>("application");
    const [modalActionState, setModalActionState] = React.useState<ModalActionState | null>(null);
    const existingApplication = useApplication(property.id, selectedUnit.id);

    // Calculate all pricing in one place
    const pricing = useMemo(
        () => calculatePricing({ selectedUnit, property, rentalForm }),
        [selectedUnit, property, rentalForm]
    );

    // Reset state when modal closes
    const handleClose = useCallback(() => {
        setStep("application");
        setModalActionState(null);
        onClose();
    }, [onClose]);

    // Use the unified hook to manage actions based on step
    useApplicationModalActions({
        property,
        selectedUnit,
        totalWeeklyRent: pricing.totalWeeklyRent,
        onClose: handleClose,
        rentalForm,
        step,
        setStep,
        existingApplication,
        setModalActionState,
    });

    // Get modal title based on current step
    const modalTitle = useMemo(() => {
        if (step === "application") {
            return existingApplication?.id ? "Update Application" : "New Application";
        }
        return "Review Your Application";
    }, [step, existingApplication?.id]);

    // Build modal buttons from action state
    const { primaryButton, secondaryButton } = useMemo(() => {
        if (!modalActionState) {
            return { primaryButton: undefined, secondaryButton: undefined };
        }

        const primary: ModalButton = {
            label: modalActionState.submitText,
            onClick: modalActionState.onSubmit,
            variant: "primary",
            disabled: !modalActionState.canSubmit,
            isLoading: modalActionState.isSubmitting,
            icon: step === "application" ? "chevron-right" : "check",
            iconPosition: "right",
        };

        const secondary: ModalButton = modalActionState.onBack
            ? {
                  label: "Back",
                  onClick: modalActionState.onBack,
                  variant: "secondary",
                  disabled: modalActionState.isSubmitting,
                  icon: "chevron-left",
                  iconPosition: "left",
              }
            : {
                  label: "Cancel",
                  onClick: modalActionState.onCancel,
                  variant: "secondary",
                  disabled: modalActionState.isSubmitting,
              };

        return { primaryButton: primary, secondaryButton: secondary };
    }, [step, modalActionState]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={modalTitle}
            size="xl"
            primaryButton={primaryButton}
            secondaryButton={secondaryButton}
        >
            {step === "application" && (
                <ApplicationForm
                    property={property}
                    selectedUnit={selectedUnit}
                    totalWeeklyRent={pricing.totalWeeklyRent}
                    rentalForm={rentalForm}
                    updateRentalForm={updateRentalForm}
                />
            )}

            {step === "review" && (
                <ApplicationReview
                    property={property}
                    selectedUnit={selectedUnit}
                    applicationId={existingApplication?.id}
                />
            )}

            {step === "confirm" && (
                <ApplicationConfirm
                    property={property}
                    selectedUnit={selectedUnit}/>
            )}
        </Modal>
    );
}
