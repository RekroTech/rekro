"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationReview } from "./ApplicationReview";
import { RentalFormData } from "@/components/Property/types";
import { calculatePricing } from "@/components/Property/pricing";
import { useHasApplied } from "@/lib/react-query/hooks/application/useApplications";

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property;
    selectedUnit: Unit;
    isEntireHome: boolean;
    rentalForm: RentalFormData;
    setRentalForm: (rentalForm: RentalFormData) => void;
}

type Step = "application" | "review";

export function ApplicationModal({
    isOpen,
    onClose,
    property,
    selectedUnit,
    isEntireHome,
    rentalForm,
    setRentalForm,
}: ApplicationModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>("application");

    // Check if user has already applied to this property/unit
    const existingApplication = useHasApplied(property.id, selectedUnit?.id);
    // Calculate all pricing in one place
    const pricing = useMemo(
        () => calculatePricing({ selectedUnit, property, rentalForm }),
        [selectedUnit, property, rentalForm]
    );

    // Reset to first step when modal opens
    useEffect(() => {
        if (isOpen && currentStep !== "application") {
            // Use setTimeout to defer state update and avoid cascading renders
            const timeoutId = setTimeout(() => {
                setCurrentStep("application");
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen, currentStep]);

    const handleNext = () => {
        setCurrentStep("review");
    };

    const handleBack = () => {
        setCurrentStep("application");
    };

    const handleApplicationSuccess = () => {
        onClose();
    };

    const getModalTitle = () => {
        const action = existingApplication ? "Update Application for" : "Apply for";
        if (currentStep === "application") {
            return `${action} ${property.title}`;
        }
        return `Review your Application`;
    };

    const handleClose = () => {
        setCurrentStep("application");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()} size="xl">
            {currentStep === "application" && (
                <ApplicationForm
                    property={property}
                    selectedUnit={selectedUnit}
                    isEntireHome={isEntireHome}
                    totalWeeklyRent={pricing.totalWeeklyRent}
                    onNext={handleNext}
                    onSuccess={handleApplicationSuccess}
                    rentalData={rentalForm}
                    onChange={setRentalForm}
                    existingApplicationId={existingApplication?.id}
                />
            )}

            {currentStep === "review" && existingApplication && (
                <ApplicationReview
                    propertyId={property.id}
                    unitId={selectedUnit?.id}
                    applicationId={existingApplication.id}
                    onSuccess={handleApplicationSuccess}
                    onCancel={handleClose}
                    showBackButton={true}
                    onBack={handleBack}
                />
            )}
        </Modal>
    );
}
