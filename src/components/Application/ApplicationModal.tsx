"use client";

import { useState, useMemo, useCallback } from "react";
import { Modal } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationReview } from "./ApplicationReview/ApplicationReview";
import { calculatePricing } from "@/components/Property/pricing";
import { useHasApplied } from "@/lib/react-query/hooks/application/useApplications";
import { useRentalForm } from "@/contexts";

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property;
    selectedUnit: Unit;
    isEntireHome: boolean;
}

type Step = "application" | "review";

export function ApplicationModal({
    isOpen,
    onClose,
    property,
    selectedUnit,
    isEntireHome,
}: ApplicationModalProps) {
    const { rentalForm } = useRentalForm();
    const [currentStep, setCurrentStep] = useState<Step>("application");
    const [submittedApplicationId, setSubmittedApplicationId] = useState<string | null>(null);

    // Check if user has already applied to this property/unit
    const existingApplication = useHasApplied(property.id, selectedUnit?.id);

    // Calculate all pricing in one place
    const pricing = useMemo(
        () => calculatePricing({ selectedUnit, property, rentalForm }),
        [selectedUnit, property, rentalForm]
    );

    // Reset state when modal closes
    const handleClose = useCallback(() => {
        setCurrentStep("application");
        setSubmittedApplicationId(null);
        onClose();
    }, [onClose]);

    // Handle successful application submission (from ApplicationForm)
    const handleApplicationSubmit = useCallback((applicationId: string) => {
        setSubmittedApplicationId(applicationId);
        setCurrentStep("review");
    }, []);

    // Handle back from review to form
    const handleBack = useCallback(() => {
        setCurrentStep("application");
    }, []);

    // Determine which application ID to use for review
    const applicationIdForReview = submittedApplicationId ?? existingApplication?.id;

    const getModalTitle = () => {
        const action = existingApplication ? "Update Application for" : "Apply for";
        if (currentStep === "application") {
            return `${action} ${property.title}`;
        }
        return "Review Your Application";
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()} size="xl">
            {currentStep === "application" && (
                <ApplicationForm
                    property={property}
                    selectedUnit={selectedUnit}
                    isEntireHome={isEntireHome}
                    totalWeeklyRent={pricing.totalWeeklyRent}
                    onSuccess={handleApplicationSubmit}
                    existingApplicationId={existingApplication?.id}
                />
            )}

            {currentStep === "review" && (
                <ApplicationReview
                    property={property}
                    selectedUnit={selectedUnit}
                    applicationId={applicationIdForReview}
                    onSuccess={handleClose}
                    onCancel={handleClose}
                    onBack={handleBack}
                />
            )}
        </Modal>
    );
}
