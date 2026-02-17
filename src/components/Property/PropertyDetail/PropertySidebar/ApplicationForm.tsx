"use client";

import { useState } from "react";
import { Button, Icon, Input, Select, Textarea } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { ApplicationType } from "@/types/db";
import { Inclusions } from "../Inclusions/Inclusions";
import { useUpsertApplication } from "@/lib/react-query/hooks/application/useApplications";
import { LEASE_MONTH_OPTIONS } from "@/components/Property/constants";
import { useRentalForm } from "@/contexts";

interface ApplicationFormProps {
    property: Property;
    selectedUnit: Unit;
    isEntireHome: boolean;
    totalWeeklyRent: number;
    onNext: () => void;
    onSuccess?: () => void;
    existingApplicationId?: string; // Optional: if provided, will update existing application
}

export function ApplicationForm({
    property,
    selectedUnit,
    isEntireHome,
    totalWeeklyRent,
    onNext,
    onSuccess,
    existingApplicationId,
}: ApplicationFormProps) {
    const { rentalForm, updateRentalForm } = useRentalForm();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const upsertApplicationMutation = useUpsertApplication();

    const handleNext = async () => {
        // Validate required fields
        if (!rentalForm.moveInDate || !rentalForm.rentalDuration) {
            alert("Please fill in all required fields (Move-in date and Tenancy duration)");
            return;
        }

        setIsSubmitting(true);
        try {
            await upsertApplicationMutation.mutateAsync({
                applicationId: existingApplicationId,
                propertyId: property.id,
                unitId: selectedUnit?.id || null,
                applicationType: (isEntireHome ? "group" : "individual") as ApplicationType,
                moveInDate: rentalForm.moveInDate,
                rentalDuration: rentalForm.rentalDuration.toString(),
                proposedRent: rentalForm.proposedRent,
                totalRent: totalWeeklyRent,
                inclusions: rentalForm.inclusions,
                occupancyType: rentalForm.occupancyType,
                message: rentalForm.message,
            });

            if (onSuccess) {
                onSuccess();
            } else {
                onNext();
            }
        } catch (error) {
            console.error("Application save failed:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to save application. Please try again."
            );
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
                            <Input
                                label="Move In Date"
                                type="date"
                                value={rentalForm.moveInDate}
                                onChange={(e) => updateRentalForm({ moveInDate: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Select
                                label="Rental Duration"
                                value={rentalForm.rentalDuration.toString()}
                                onChange={(e) =>
                                    updateRentalForm({ rentalDuration: Number(e.target.value) })
                                }
                                options={LEASE_MONTH_OPTIONS}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Input
                                label="Proposed Weekly Rent"
                                type="number"
                                value={rentalForm.proposedRent || ""}
                                onChange={(e) => updateRentalForm({ proposedRent: e.target.value })}
                                placeholder="Enter your proposed rent amount"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-surface-subtle rounded-lg border border-border mb-3 sm:mb-4">
                <h4 className="text-sm font-semibold text-text mb-4">Inclusions</h4>
                <Inclusions
                    property={property}
                    inclusions={rentalForm.inclusions}
                    onChange={(nextInclusions) => updateRentalForm({ inclusions: nextInclusions })}
                    isEntireHome={isEntireHome}
                    effectiveOccupancyType={rentalForm.occupancyType}
                    rentalDuration={rentalForm.rentalDuration}
                />
            </div>

            {/* Rent Display at Bottom */}
            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border mb-3 sm:mb-4">
                <span className="text-sm text-text-muted">Total Rent:</span>
                <span className="text-2xl font-bold text-primary-600">${totalWeeklyRent.toFixed(2)}</span>
            </div>

            {/* Application message input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">
                    Message to Landlord (Optional)
                </label>
                <Textarea
                    value={rentalForm.message || ""}
                    onChange={(e) => updateRentalForm({ message: e.target.value })}
                    placeholder="Introduce yourself and explain why you would be a great tenant..."
                    rows={4}
                />
                <p className="text-xs text-text-muted mt-1">
                    Share any relevant information about yourself, your rental history, or why
                    you&apos;re interested in this property
                </p>
            </div>

            {/* Next button */}
            <div className="flex justify-center">
                <Button variant="primary" onClick={handleNext} disabled={isSubmitting}>
                    {isSubmitting
                        ? "Saving..."
                        : existingApplicationId
                          ? "Update Application"
                          : "Submit Application"}
                    {!isSubmitting && <Icon name="chevron-right" className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </div>
    );
}
