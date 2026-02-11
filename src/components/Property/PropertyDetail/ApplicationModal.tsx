"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Icon } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { Inclusions } from "./Inclusions/Inclusions";
import { ApplicationForm } from "../ApplicationForm";
import { InclusionsData } from "@/components/Property/types";
import { calculatePricing } from "@/components/Property/utils";

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property;
    selectedUnit: Unit;
    inclusions: InclusionsData;
    onChange: (inclusions: InclusionsData) => void;
    isEntireHome: boolean;
}

type Step = "inclusions" | "application";

export function ApplicationModal({
    isOpen,
    onClose,
    property,
    selectedUnit,
    inclusions,
    onChange,
    isEntireHome,
}: ApplicationModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>("inclusions");

    const getDefaultStartDate = () =>
        selectedUnit?.available_from ?? new Date().toISOString().split("T")[0] ?? "";

    // Calculate all pricing in one place
    const pricing = useMemo(
        () => calculatePricing({ selectedUnit, property, inclusions }),
        [selectedUnit, property, inclusions]
    );

    // Reset to first step when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep("inclusions");
            if (!inclusions.selectedStartDate) {
                onChange({
                    ...inclusions,
                    selectedStartDate: getDefaultStartDate(),
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleNext = () => {
        setCurrentStep("application");
    };

    const handleBack = () => {
        setCurrentStep("inclusions");
    };

    const handleApplicationSuccess = () => {
        onClose();
    };

    const getModalTitle = () => {
        if (currentStep === "inclusions") {
            return "Review your inclusions";
        }
        return `Apply for ${property.title}`;
    };

    const handleClose = () => {
        setCurrentStep("inclusions");
        onClose();
    };

    // Prepare inclusions summary for additional info
    const inclusionsSummary = {
        lease: inclusions.selectedLease,
        startDate: inclusions.selectedStartDate,
        furniture: inclusions.furnitureSelected,
        bills: inclusions.billsIncluded,
        cleaning: inclusions.regularCleaningSelected,
        dualOccupancy: inclusions.isDualOccupancy,
        occupants: inclusions.entireHomeOccupants,
        carpark: inclusions.carparkSelected,
        storageCage: inclusions.storageCageSelected,
    };

    const additionalInfoWithInclusions = `Selected Add-ons: ${JSON.stringify(inclusionsSummary, null, 2)}`;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()} size="xl">
            {currentStep === "inclusions" && (
                <div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-3 sm:mb-4">
                        <Inclusions
                            property={property}
                            inclusions={inclusions}
                            onChange={onChange}
                            isEntireHome={isEntireHome}
                            effectiveIsDualOccupancy={inclusions.isDualOccupancy}
                        />
                    </div>

                    {/* Rent Display at Bottom */}
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200 mb-3 sm:mb-4">
                        <span className="text-sm text-text-muted">Total Rent:</span>
                        <span className="text-2xl font-bold text-primary-600">
                            ${pricing.totalWeeklyRent.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex justify-center">
                        <Button variant="primary" onClick={handleNext}>
                            Next: Application Form
                            <Icon name="chevron-right" className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {currentStep === "application" && (
                <ApplicationForm
                    propertyId={property.id}
                    unitId={selectedUnit?.id}
                    isEntireHome={isEntireHome}
                    onSuccess={handleApplicationSuccess}
                    onCancel={handleClose}
                    additionalInfo={additionalInfoWithInclusions}
                    showBackButton={true}
                    onBack={handleBack}
                    initialMoveInDate={inclusions.selectedStartDate}
                    initialRentalDuration={inclusions.selectedLease.toString()}
                />
            )}
        </Modal>
    );
}
