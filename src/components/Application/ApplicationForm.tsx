"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button, Icon, Input, Select, Textarea } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { ApplicationType } from "@/types/db";
import { useUpsertApplication, useApplication } from "@/lib/react-query/hooks/application/useApplications";
import { LEASE_MONTH_OPTIONS } from "@/components/Property/constants";
import { useRentalForm } from "@/contexts";
import { useToast } from "@/hooks/useToast";
import type { Inclusions as InclusionsType } from "@/components/Property/types";
import { Inclusions } from "@/components/Property/PropertyDetail/Inclusions/Inclusions";

interface ApplicationFormProps {
    property: Property;
    selectedUnit: Unit;
    isEntireHome: boolean;
    totalWeeklyRent: number;
    onSuccess: (applicationId: string) => void;
    existingApplicationId?: string;
}

interface ValidationErrors {
    moveInDate?: string;
    rentalDuration?: string;
}

type InclusionValue = { selected?: boolean; price?: number };

type NormalizedInclusions = Record<string, { selected: boolean; price: number }>;

type ApplicationComparableSnapshot = {
    moveInDate: string;
    rentalDuration: string;
    proposedRent: string;
    totalRent: number;
    inclusions: NormalizedInclusions;
    occupancyType: string;
    message: string;
};

function normalizeInclusions(inclusions: InclusionsType | null | undefined): NormalizedInclusions {
    const input = (inclusions ?? {}) as Record<string, InclusionValue>;
    const keys = Object.keys(input).sort();
    const out: NormalizedInclusions = {};

    for (const key of keys) {
        const v = input[key] ?? {};
        out[key] = {
            selected: Boolean(v.selected),
            price: Number.isFinite(v.price as number) ? Number(v.price) : 0,
        };
    }

    return out;
}

function buildComparableSnapshot(params: {
    moveInDate: string | null | undefined;
    rentalDuration: string | number | null | undefined;
    proposedRent: string | number | null | undefined;
    totalRent: number | null | undefined;
    inclusions: InclusionsType | null | undefined;
    occupancyType: string | null | undefined;
    message: string | null | undefined;
}): ApplicationComparableSnapshot {
    return {
        moveInDate: params.moveInDate ?? "",
        rentalDuration:
            params.rentalDuration === null || params.rentalDuration === undefined
                ? ""
                : String(params.rentalDuration),
        proposedRent:
            params.proposedRent === null || params.proposedRent === undefined
                ? ""
                : String(params.proposedRent),
        totalRent: params.totalRent ?? 0,
        inclusions: normalizeInclusions(params.inclusions),
        occupancyType: params.occupancyType ?? "",
        message: params.message ?? "",
    };
}

function stableStringifySnapshot(snapshot: ApplicationComparableSnapshot): string {
    return JSON.stringify({
        ...snapshot,
        inclusions: Object.keys(snapshot.inclusions)
            .sort()
            .reduce<NormalizedInclusions>((acc, k) => {
                const v = snapshot.inclusions[k];
                if (v) acc[k] = v;
                return acc;
            }, {}),
    });
}

export function ApplicationForm({
    property,
    selectedUnit,
    isEntireHome,
    totalWeeklyRent,
    onSuccess,
    existingApplicationId,
}: ApplicationFormProps) {
    const { rentalForm, updateRentalForm } = useRentalForm();
    const { showToast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const upsertApplicationMutation = useUpsertApplication();

    // Fetch existing application if updating
    const { data: existingApplication } = useApplication(existingApplicationId || null);

    // Store initial comparable snapshot for change detection
    const initialSnapshotStringRef = useRef<string | null>(null);
    const initialSnapshotAppIdRef = useRef<string | null>(null);

    // Reset the snapshot whenever we switch which application we're editing.
    useEffect(() => {
        if (initialSnapshotAppIdRef.current !== (existingApplicationId ?? null)) {
            initialSnapshotAppIdRef.current = existingApplicationId ?? null;
            initialSnapshotStringRef.current = null;
        }
    }, [existingApplicationId]);

    // Build a canonical snapshot from current form state
    const currentSnapshotString = useMemo(() => {
        const snapshot = buildComparableSnapshot({
            moveInDate: rentalForm.moveInDate,
            rentalDuration: rentalForm.rentalDuration,
            proposedRent: rentalForm.proposedRent,
            totalRent: totalWeeklyRent,
            inclusions: rentalForm.inclusions,
            occupancyType: rentalForm.occupancyType,
            message: rentalForm.message,
        });

        return stableStringifySnapshot(snapshot);
    }, [
        rentalForm.moveInDate,
        rentalForm.rentalDuration,
        rentalForm.proposedRent,
        rentalForm.inclusions,
        rentalForm.occupancyType,
        rentalForm.message,
        totalWeeklyRent,
    ]);

    // Initialize initial snapshot when existing application + hydrated form are present.
    useEffect(() => {
        if (!existingApplicationId) return;
        if (!existingApplication) return;
        if (initialSnapshotStringRef.current) return;

        // Important: use CURRENT rentalForm shape as canonical source.
        // The RentalFormProvider hydrates defaults + app fields; comparing raw server fields
        // (especially inclusions) can cause perpetual "dirty" state.
        initialSnapshotStringRef.current = currentSnapshotString;
    }, [existingApplicationId, existingApplication, currentSnapshotString]);

    const hasChanges = useMemo(() => {
        if (!existingApplicationId) return true; // create mode
        if (!initialSnapshotStringRef.current) return false; // not hydrated yet; avoid flashing "Update"
        return currentSnapshotString !== initialSnapshotStringRef.current;
    }, [existingApplicationId, currentSnapshotString]);

    const buttonText = useMemo(() => {
        if (!existingApplicationId) return "Save & Continue";
        return hasChanges ? "Update & Continue" : "Continue";
    }, [existingApplicationId, hasChanges]);

    const validateForm = useCallback((): boolean => {
        const errors: ValidationErrors = {};

        if (!rentalForm.moveInDate) {
            errors.moveInDate = "Move-in date is required";
        }

        if (!rentalForm.rentalDuration) {
            errors.rentalDuration = "Tenancy duration is required";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [rentalForm.moveInDate, rentalForm.rentalDuration]);

    const handleSubmit = useCallback(async () => {
        setValidationErrors({});

        if (!validateForm()) {
            showToast("Please fill in all required fields", "error");
            return;
        }

        if (existingApplicationId && !hasChanges) {
            showToast("No changes detected", "info");
            onSuccess(existingApplicationId);
            return;
        }

        setIsSubmitting(true);

        try {
            const savedApplication = await upsertApplicationMutation.mutateAsync({
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

            // Reset baseline after successful save
            initialSnapshotStringRef.current = currentSnapshotString;

            showToast(
                existingApplicationId ? "Application updated successfully" : "Application saved successfully",
                "success"
            );

            onSuccess(savedApplication.id);
        } catch (error) {
            console.error("Application save failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to save application. Please try again.";
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    }, [
        validateForm,
        showToast,
        existingApplicationId,
        hasChanges,
        onSuccess,
        upsertApplicationMutation,
        property.id,
        selectedUnit?.id,
        isEntireHome,
        rentalForm.moveInDate,
        rentalForm.rentalDuration,
        rentalForm.proposedRent,
        rentalForm.inclusions,
        rentalForm.occupancyType,
        rentalForm.message,
        totalWeeklyRent,
        currentSnapshotString,
    ]);

    const handleMoveInDateChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateRentalForm({ moveInDate: e.target.value });
            if (validationErrors.moveInDate) {
                setValidationErrors((prev) => ({ ...prev, moveInDate: undefined }));
            }
        },
        [updateRentalForm, validationErrors.moveInDate]
    );

    const handleDurationChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            updateRentalForm({ rentalDuration: Number(e.target.value) });
            if (validationErrors.rentalDuration) {
                setValidationErrors((prev) => ({ ...prev, rentalDuration: undefined }));
            }
        },
        [updateRentalForm, validationErrors.rentalDuration]
    );

    const handleProposedRentChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateRentalForm({ proposedRent: e.target.value });
        },
        [updateRentalForm]
    );

    const handleMessageChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            updateRentalForm({ message: e.target.value });
        },
        [updateRentalForm]
    );

    const handleInclusionsChange = useCallback(
        (nextInclusions: typeof rentalForm.inclusions) => {
            updateRentalForm({ inclusions: nextInclusions });
        },
        [updateRentalForm, rentalForm]
    );

    return (
        <div className="space-y-6">
            {/* Tenancy details */}
            <div>
                <h3 className="text-lg font-semibold text-text mb-4">Tenancy Details</h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Move In Date"
                                type="date"
                                value={rentalForm.moveInDate}
                                onChange={handleMoveInDateChange}
                                error={validationErrors.moveInDate}
                                required
                            />
                        </div>

                        <div>
                            <Select
                                label="Rental Duration"
                                value={rentalForm.rentalDuration.toString()}
                                onChange={handleDurationChange}
                                options={LEASE_MONTH_OPTIONS}
                                error={validationErrors.rentalDuration}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Input
                                label="Proposed Weekly Rent (Optional)"
                                type="number"
                                value={rentalForm.proposedRent || ""}
                                onChange={handleProposedRentChange}
                                placeholder="Enter your proposed rent amount"
                                min="0"
                                step="0.01"
                            />
                            <p className="text-xs text-text-muted mt-1">
                                Leave blank to accept the listed rent of ${totalWeeklyRent.toFixed(2)}/week
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inclusions */}
            <div className="p-4 bg-surface-subtle rounded-lg border border-border">
                <h4 className="text-sm font-semibold text-text mb-4">Inclusions</h4>
                <Inclusions
                    property={property}
                    inclusions={rentalForm.inclusions}
                    onChange={handleInclusionsChange}
                    isEntireHome={isEntireHome}
                    effectiveOccupancyType={rentalForm.occupancyType}
                    rentalDuration={rentalForm.rentalDuration}
                />
            </div>

            {/* Total Rent Display */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm font-medium text-text-muted">Total Weekly Rent:</span>
                <span className="text-2xl font-bold text-primary-600">${totalWeeklyRent.toFixed(2)}</span>
            </div>

            {/* Message to Landlord */}
            <div>
                <label className="block text-sm font-medium text-text mb-2">Message to Landlord (Optional)</label>
                <Textarea
                    value={rentalForm.message || ""}
                    onChange={handleMessageChange}
                    placeholder="Introduce yourself and explain why you would be a great tenant..."
                    rows={4}
                />
                <p className="text-xs text-text-muted mt-1">
                    Share any relevant information about yourself, your rental history, or why you&apos;re interested in this
                    property
                </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-w-[200px]"
                >
                    {isSubmitting ? (
                        <>
                            <Icon name="spinner" className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            {buttonText}
                            <Icon name="chevron-right" className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
