"use client";

import { useState, useEffect } from "react";
import { Button, Icon, Input, Select, Textarea } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { ApplicationType } from "@/types/db";
import { Inclusions } from "../Inclusions/Inclusions";
import { RentalFormData } from "@/components/Property/types";
import { useUpsertApplication } from "@/lib/react-query/hooks/application/useApplications";
import type { ApplicationFormData } from "@/types/application.types";

interface ApplicationFormProps {
    property: Property;
    selectedUnit: Unit;
    rentalData: RentalFormData;
    onChange: (rentalData: RentalFormData) => void;
    isEntireHome: boolean;
    totalWeeklyRent: number;
    onNext: () => void;
    onSuccess?: () => void;
    existingApplicationId?: string; // Optional: if provided, will update existing application
}

export function ApplicationForm({
    property,
    selectedUnit,
    rentalData,
    onChange,
    isEntireHome,
    totalWeeklyRent,
    onNext,
    onSuccess,
    existingApplicationId,
}: ApplicationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const upsertApplicationMutation = useUpsertApplication();

    // Internal state for application data - initialized from rentalData (synced with PropertySidebar)
    const [applicationData, setApplicationData] = useState<ApplicationFormData>({
        moveInDate: rentalData.moveInDate || "",
        rentalDuration: rentalData.rentalDuration?.toString() || "12",
        proposedRent: "",
        message: "",
        inclusions: rentalData.inclusions || [],
        occupancyType: rentalData.occupancyType || "single",
    });

    // Sync applicationData with rentalData state from PropertySidebar
    useEffect(() => {
        setApplicationData(prev => ({
            ...prev,
            inclusions: rentalData.inclusions,
            occupancyType: rentalData.occupancyType || "single",
        }));
    }, [rentalData.inclusions, rentalData.occupancyType]);

    const updateApplicationData = (updates: Partial<ApplicationFormData>) => {
        setApplicationData(prev => ({ ...prev, ...updates }));
    };

    const handleNext = async () => {
        // Validate required fields
        if (!applicationData.moveInDate || !applicationData.rentalDuration) {
            alert("Please fill in all required fields (Move-in date and Tenancy duration)");
            return;
        }

        // Update rentalData with the form data before proceeding
        onChange({
            ...rentalData,
            moveInDate: applicationData.moveInDate,
            rentalDuration: parseInt(applicationData.rentalDuration, 10),
        });

        // Save or update application to database
        setIsSubmitting(true);
        try {
            await upsertApplicationMutation.mutateAsync({
                applicationId: existingApplicationId, // If provided, will update; otherwise creates new
                propertyId: property.id,
                unitId: selectedUnit?.id || null,
                applicationType: (isEntireHome ? "group" : "individual") as ApplicationType,
                moveInDate: applicationData.moveInDate,
                rentalDuration: applicationData.rentalDuration,
                proposedRent: applicationData.proposedRent,
                totalRent: totalWeeklyRent,
                inclusions: rentalData.inclusions,
                occupancyType: applicationData.occupancyType,
                message: applicationData.message,
            });

            // Call onSuccess if provided, otherwise call onNext
            if (onSuccess) {
                onSuccess();
            } else {
                onNext();
            }
        } catch (error) {
            console.error("Application save failed:", error);
            alert(error instanceof Error ? error.message : "Failed to save application. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            {/* Tenancy details */}
            <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-text mb-4">Tenancy Details</h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                Select your preferred move in date <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                value={applicationData.moveInDate}
                                onChange={(e) => updateApplicationData({ moveInDate: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                Select your tenancy duration <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={applicationData.rentalDuration}
                                onChange={(e) => updateApplicationData({ rentalDuration: e.target.value })}
                                options={[
                                    { value: "", label: "Select tenancy duration" },
                                    { value: "4", label: "4 months" },
                                    { value: "6", label: "6 months" },
                                    { value: "9", label: "9 months" },
                                    { value: "12", label: "12 months" },
                                ]}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text mb-2">
                                Proposed Rent (per week)
                            </label>
                            <Input
                                type="number"
                                value={applicationData.proposedRent || ""}
                                onChange={(e) => updateApplicationData({ proposedRent: e.target.value })}
                                placeholder="Enter your proposed rent amount"
                                min="0"
                                step="0.01"
                            />
                            <p className="text-xs text-text-muted mt-1">
                                Optional: Propose your preferred rent amount
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-surface-subtle rounded-lg border border-border mb-3 sm:mb-4">
                <Inclusions
                    property={property}
                    inclusions={rentalData.inclusions}
                    onChange={(nextInclusions) => onChange({ ...rentalData, inclusions: nextInclusions })}
                    isEntireHome={isEntireHome}
                    effectiveOccupancyType={rentalData.occupancyType}
                    rentalDuration={rentalData.rentalDuration}
                />
            </div>

            {/* Rent Display at Bottom */}
            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border mb-3 sm:mb-4">
                <span className="text-sm text-text-muted">Total Rent:</span>
                <span className="text-2xl font-bold text-primary-600">
                    ${totalWeeklyRent.toFixed(2)}
                </span>
            </div>

            {/* Application message input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">
                    Message to Landlord (Optional)
                </label>
                <Textarea
                    value={applicationData.message || ""}
                    onChange={(e) => updateApplicationData({ message: e.target.value })}
                    placeholder="Introduce yourself and explain why you would be a great tenant..."
                    rows={4}
                />
                <p className="text-xs text-text-muted mt-1">
                    Share any relevant information about yourself, your rental history, or why you&apos;re interested in this property
                </p>
            </div>

            {/* Next button */}
            <div className="flex justify-center">
                <Button variant="primary" onClick={handleNext} disabled={isSubmitting}>
                    {isSubmitting
                        ? "Saving..."
                        : existingApplicationId
                            ? "Update Application"
                            : "Submit Application"
                    }
                    {!isSubmitting && <Icon name="chevron-right" className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </div>
    );
}

