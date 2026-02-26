"use client";

import { Input, SegmentedControl, Select, Textarea } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import type { RentalFormData } from "@/components/Property";
import { Inclusions } from "@/components/Property";
import { getMaxStartDate, getMinStartDate } from "@/lib/utils";
import { LEASE_MONTH_OPTIONS } from "@/components/PropertyForm";

interface ApplicationFormProps {
    property: Property;
    selectedUnit: Unit;
    rentalForm: RentalFormData;
    updateRentalForm: (updates: Partial<RentalFormData>) => void;
}

export function ApplicationForm({
    property,
    selectedUnit,
    rentalForm,
    updateRentalForm,
}: ApplicationFormProps) {
    const isEntireHome = selectedUnit.listing_type === "entire_home";
    const canShowDualOccupancy = !isEntireHome && selectedUnit.max_occupants === 2;

    return (
        <div className="space-y-6 mt-2">
            {/* Tenancy details */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Input
                            label="Move In Date"
                            type="date"
                            value={rentalForm.moveInDate}
                            onChange={(e) => updateRentalForm({ moveInDate: e.target.value })}
                            min={getMinStartDate(selectedUnit.available_from)}
                            max={getMaxStartDate(selectedUnit.available_from, selectedUnit.available_to)}
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

                    {/* Occupancy Toggle */}
                    {canShowDualOccupancy && (
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-text mb-2">
                                Occupancy Type
                            </label>

                            <SegmentedControl<"single" | "dual">
                                ariaLabel="Occupancy type"
                                value={rentalForm.occupancyType}
                                onChange={(next) => updateRentalForm({ occupancyType: next })}
                                options={[
                                    { value: "single", label: "Single" },
                                    { value: "dual", label: "Dual Occupancy" },
                                ]}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Inclusions */}
            <div className="p-3 sm:p-4 bg-surface-subtle rounded-lg border border-border">
                <h4 className="text-sm font-semibold text-text mb-4">Inclusions</h4>
                <Inclusions
                    property={property}
                    inclusions={rentalForm.inclusions}
                    onChange={(nextInclusions) => updateRentalForm({ inclusions: nextInclusions })}
                    isEntireHome={selectedUnit.listing_type === "entire_home"}
                    effectiveOccupancyType={rentalForm.occupancyType}
                    rentalDuration={rentalForm.rentalDuration}
                />
            </div>

            {/* Total Rent Display */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm font-medium text-text-muted">Total Weekly Rent:</span>
                <span className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ${rentalForm.totalRent.toFixed(2)}
                </span>
            </div>

            <div className="sm:col-span-2">
                <Input
                    label="Proposed Weekly Rent (Optional)"
                    type="number"
                    value={rentalForm.proposedRent || ""}
                    onChange={(e) => updateRentalForm({ proposedRent: e.target.value })}
                    placeholder="Enter your proposed rent amount"
                    min="0"
                    step="0.01"
                />
            </div>
            {/* Message to Rekro */}
            <div>
                <label className="block text-sm font-medium text-text mb-2">
                    Message to Rekro (Optional)
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
        </div>
    );
}
