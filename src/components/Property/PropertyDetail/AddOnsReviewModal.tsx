"use client";

import { useMemo, useEffect } from "react";
import { Modal, Button, Icon } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { FurniturePaymentOption } from "@/components/Property/types";
import {
    getBillsCostPerWeek,
    getRegularCleaningCostPerWeek,
    getEntireHomeCleaningCosts,
    getRoomFurnitureCost,
} from "@/components/Property/utils";
import {
    FURNITURE_COST,
    CARPARK_COST_PER_WEEK,
    STORAGE_CAGE_COST_PER_WEEK,
} from "@/components/Property/constants";

// Helper function to check if property has parking amenities
const hasCarpark = (amenities: string[] | null): boolean => {
    if (!amenities) return false;
    const parkingAmenities = [
        "Garage",
        "Carport",
        "Underground",
        "Secure",
        "Street",
        "Driveway",
        "Visitor",
        "Tandem",
    ];
    return amenities.some((amenity) => parkingAmenities.includes(amenity));
};

// Helper function to check if property has storage amenity
const hasStorage = (amenities: string[] | null): boolean => {
    if (!amenities) return false;
    return amenities.includes("Storage");
};

interface AddOnsReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNext: (addOns: AddOnsData) => void;
    onChange: (addOns: AddOnsData) => void;
    property: Property;
    selectedUnit: Unit;
    selectedLease: number;
    addOns: AddOnsData;
    isEntireHome: boolean;
}

export interface AddOnsData {
    furnitureSelected: boolean;
    furniturePaymentOption: FurniturePaymentOption;
    billsIncluded: boolean;
    regularCleaningSelected: boolean;
    selectedLease: number;
    selectedStartDate: string;
    isDualOccupancy: boolean;
    entireHomeOccupants: number;
    carparkSelected: boolean;
    storageCageSelected: boolean;
}

export function AddOnsReviewModal({
    isOpen,
    onClose,
    onNext,
    onChange,
    property,
    selectedUnit,
    addOns,
    isEntireHome,
}: AddOnsReviewModalProps) {
    const setState = (updater: AddOnsData | ((prev: AddOnsData) => AddOnsData)) => {
        const next = typeof updater === "function" ? updater(addOns) : updater;
        onChange(next);
    };

    // Occupancy only applies to non-entire-home rooms that support 2 occupants.
    const occupancyApplies = !isEntireHome && selectedUnit?.max_occupants === 2;

    // Effective occupancy value used for pricing.
    const effectiveIsDualOccupancy = occupancyApplies ? addOns.isDualOccupancy : false;

    // Clamp any stale dual-occupancy state when switching to units where it doesn't apply.
    useEffect(() => {
        if (!occupancyApplies && addOns.isDualOccupancy) {
            setState((prev: AddOnsData) => ({ ...prev, isDualOccupancy: false }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [occupancyApplies]);

    const getDefaultStartDate = () =>
        selectedUnit?.available_from ?? new Date().toISOString().split("T")[0] ?? "";

    // Ensure start date is always populated (controlled state might come in empty).
    useEffect(() => {
        if (isOpen && !addOns.selectedStartDate) {
            setState((p: AddOnsData) => ({ ...p, selectedStartDate: getDefaultStartDate() }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Calculate adjusted rent based on lease period
    const adjustedBaseRent = useMemo(() => {
        let baseRent = selectedUnit.price_per_week;

        // Add $100 for dual occupancy rooms
        if (!isEntireHome && effectiveIsDualOccupancy) {
            baseRent += 100;
        }

        switch (addOns.selectedLease) {
            case 4: {
                const sixMonthRent = baseRent * 1.05;
                return sixMonthRent * 1.5;
            }
            case 6:
                return baseRent * 1.05;
            case 9:
                return baseRent * (4 / 3);
            case 12:
            default:
                return baseRent;
        }
    }, [selectedUnit, addOns.selectedLease, isEntireHome, effectiveIsDualOccupancy]);

    // Calculate add-ons costs
    const addOnsCosts = useMemo(() => {
        let furnitureCost = 0;
        let furniturePerWeek = 0;

        if (addOns.furnitureSelected && addOns.furniturePaymentOption) {
            // For entire homes: full $1500
            // For individual rooms: $1500 divided by number of rooms
            const effectiveFurnitureCost = isEntireHome
                ? FURNITURE_COST
                : getRoomFurnitureCost(property.units || [], FURNITURE_COST);

            if (addOns.furniturePaymentOption === "pay_total") {
                furnitureCost = effectiveFurnitureCost;
            } else if (addOns.furniturePaymentOption === "add_to_rent") {
                const leaseWeeks = addOns.selectedLease * 4.33;
                furniturePerWeek = effectiveFurnitureCost / leaseWeeks;
            }
        }

        const billsCost = addOns.billsIncluded ? getBillsCostPerWeek(property.bedrooms) : 0;

        // Calculate cleaning costs based on property type
        let regularCleaningCost = 0;

        if (addOns.regularCleaningSelected) {
            if (isEntireHome) {
                // For entire homes: calculate based on all room units and their max_occupants
                const cleaningCosts = getEntireHomeCleaningCosts(property.units || []);
                regularCleaningCost = cleaningCosts.regularWeekly;
            } else {
                // For rooms: $35/week regular for single, $60/week for dual occupancy
                regularCleaningCost = getRegularCleaningCostPerWeek(effectiveIsDualOccupancy);
            }
        }

        // Carpark and storage cage costs - only for rooms (not entire homes)
        const carparkCost = !isEntireHome && addOns.carparkSelected ? CARPARK_COST_PER_WEEK : 0;
        const storageCageCost =
            !isEntireHome && addOns.storageCageSelected ? STORAGE_CAGE_COST_PER_WEEK : 0;

        return {
            furnitureCost,
            billsCost,
            regularCleaningCost,
            carparkCost,
            storageCageCost,
            total: furnitureCost,
            furniturePerWeek,
        };
    }, [
        addOns.furnitureSelected,
        addOns.furniturePaymentOption,
        addOns.billsIncluded,
        addOns.regularCleaningSelected,
        addOns.carparkSelected,
        addOns.storageCageSelected,
        property.bedrooms,
        property.units,
        addOns.selectedLease,
        effectiveIsDualOccupancy,
        isEntireHome,
    ]);

    // Calculate total weekly rent
    const totalWeeklyRent = useMemo(() => {
        return (
            adjustedBaseRent +
            addOnsCosts.furniturePerWeek +
            addOnsCosts.billsCost +
            addOnsCosts.regularCleaningCost +
            addOnsCosts.carparkCost +
            addOnsCosts.storageCageCost
        );
    }, [
        adjustedBaseRent,
        addOnsCosts.furniturePerWeek,
        addOnsCosts.billsCost,
        addOnsCosts.regularCleaningCost,
        addOnsCosts.carparkCost,
        addOnsCosts.storageCageCost,
    ]);

    const handleNext = () => {
        onNext({
            ...addOns,
            // We only persist dual occupancy if it applies; otherwise force false.
            isDualOccupancy: effectiveIsDualOccupancy,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Review Your Selection" size="lg">
            <div className="space-y-6">
                {/* Lease Period Selection */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-text mb-3">Lease Details</h4>

                    <div className="space-y-3">
                        <div>
                            <label
                                htmlFor="modalStartDate"
                                className="block text-xs font-medium text-text-muted mb-1"
                            >
                                Preferred Start Date
                            </label>
                            <input
                                type="date"
                                id="modalStartDate"
                                value={addOns.selectedStartDate}
                                onChange={(e) =>
                                    setState((p: AddOnsData) => ({
                                        ...p,
                                        selectedStartDate: e.target.value,
                                    }))
                                }
                                min={selectedUnit.available_from || getDefaultStartDate()}
                                max={selectedUnit.available_to || undefined}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="modalLeasePeriod"
                                className="block text-xs font-medium text-text-muted mb-1"
                            >
                                Lease Period (months)
                            </label>
                            <div className="relative">
                                <select
                                    id="modalLeasePeriod"
                                    value={addOns.selectedLease}
                                    onChange={(e) =>
                                        setState((p: AddOnsData) => ({
                                            ...p,
                                            selectedLease: Number(e.target.value),
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                                >
                                    <option value={4}>4 months</option>
                                    <option value={6}>6 months</option>
                                    <option value={9}>9 months</option>
                                    <option value={12}>12 months</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg
                                        className="fill-current h-4 w-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Dual Occupancy Option - Only for rooms with max 2 occupants */}
                        {occupancyApplies && (
                            <div>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={addOns.isDualOccupancy}
                                        onChange={(e) =>
                                            setState((p: AddOnsData) => ({
                                                ...p,
                                                isDualOccupancy: e.target.checked,
                                            }))
                                        }
                                        className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-text flex-1">
                                        <span className="font-medium">Dual occupancy</span>
                                        <span className="text-text-muted block text-xs">
                                            +$100/week for 2 people
                                        </span>
                                    </span>
                                </label>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-300">
                            <span className="text-text-muted">Base rent:</span>
                            <span className="font-bold text-primary-600">
                                ${adjustedBaseRent.toFixed(2)}/week
                            </span>
                        </div>
                    </div>
                </div>

                {/* Add-ons Section */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-text mb-3">Add-ons (Optional)</h4>

                    <div className="space-y-4">
                        {/* Furniture Add-on - Only if property is unfurnished */}
                        {!property.furnished && (
                            <div className="space-y-2">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={addOns.furnitureSelected}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setState((p: AddOnsData) => ({
                                                ...p,
                                                furnitureSelected: checked,
                                                furniturePaymentOption: checked
                                                    ? p.furniturePaymentOption
                                                    : null,
                                            }));
                                        }}
                                        className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-text flex-1">
                                        <span className="font-medium">Furnished package</span>
                                        <span className="text-text-muted block text-xs">
                                            $
                                            {isEntireHome
                                                ? FURNITURE_COST
                                                : getRoomFurnitureCost(
                                                      property.units || [],
                                                      FURNITURE_COST
                                                  ).toFixed(0)}{" "}
                                            total
                                        </span>
                                    </span>
                                </label>

                                {addOns.furnitureSelected && (
                                    <div className="ml-6 space-y-2 p-3 bg-white rounded-md border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="modalFurniturePayment"
                                                checked={
                                                    addOns.furniturePaymentOption === "add_to_rent"
                                                }
                                                onChange={() =>
                                                    setState((p: AddOnsData) => ({
                                                        ...p,
                                                        furniturePaymentOption: "add_to_rent",
                                                    }))
                                                }
                                                className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-text">
                                                Add to rent{" "}
                                                <span className="text-text-muted">
                                                    ($
                                                    {(
                                                        (isEntireHome
                                                            ? FURNITURE_COST
                                                            : getRoomFurnitureCost(
                                                                  property.units || [],
                                                                  FURNITURE_COST
                                                              )) /
                                                        (addOns.selectedLease * 4.33)
                                                    ).toFixed(2)}
                                                    /week)
                                                </span>
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="modalFurniturePayment"
                                                checked={
                                                    addOns.furniturePaymentOption === "pay_total"
                                                }
                                                onChange={() =>
                                                    setState((p: AddOnsData) => ({
                                                        ...p,
                                                        furniturePaymentOption: "pay_total",
                                                    }))
                                                }
                                                className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-text">
                                                Pay total upfront{" "}
                                                <span className="text-text-muted">
                                                    ($
                                                    {isEntireHome
                                                        ? FURNITURE_COST
                                                        : getRoomFurnitureCost(
                                                              property.units || [],
                                                              FURNITURE_COST
                                                          ).toFixed(0)}
                                                    )
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bills Included Add-on */}
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={addOns.billsIncluded}
                                onChange={(e) =>
                                    setState((p: AddOnsData) => ({
                                        ...p,
                                        billsIncluded: e.target.checked,
                                    }))
                                }
                                className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-sm text-text flex-1">
                                <span className="font-medium">Bills included</span>
                                <span className="text-text-muted block text-xs">
                                    +${getBillsCostPerWeek(property.bedrooms)}/week
                                </span>
                            </span>
                        </label>

                        {/* Regular Cleaning Add-on */}
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={addOns.regularCleaningSelected}
                                onChange={(e) =>
                                    setState((p: AddOnsData) => ({
                                        ...p,
                                        regularCleaningSelected: e.target.checked,
                                    }))
                                }
                                className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-sm text-text flex-1">
                                <span className="font-medium">Regular cleaning service</span>
                                <span className="text-text-muted block text-xs">
                                    {isEntireHome ? (
                                        <>
                                            $
                                            {
                                                getEntireHomeCleaningCosts(property.units || [])
                                                    .regularWeekly
                                            }
                                            /week
                                        </>
                                    ) : (
                                        <>${effectiveIsDualOccupancy ? 60 : 35}/week</>
                                    )}
                                </span>
                            </span>
                        </label>

                        {/* Carpark Add-on - Only for rooms (not entire homes) and if property has parking */}
                        {!isEntireHome && hasCarpark(property.amenities) && (
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={addOns.carparkSelected}
                                    onChange={(e) =>
                                        setState((p: AddOnsData) => ({
                                            ...p,
                                            carparkSelected: e.target.checked,
                                        }))
                                    }
                                    className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-sm text-text flex-1">
                                    <span className="font-medium">Carpark</span>
                                    <span className="text-text-muted block text-xs">
                                        +${CARPARK_COST_PER_WEEK}/week
                                    </span>
                                </span>
                            </label>
                        )}

                        {/* Storage Cage Add-on - Only for rooms (not entire homes) and if property has storage */}
                        {!isEntireHome && hasStorage(property.amenities) && (
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={addOns.storageCageSelected}
                                    onChange={(e) =>
                                        setState((p: AddOnsData) => ({
                                            ...p,
                                            storageCageSelected: e.target.checked,
                                        }))
                                    }
                                    className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-sm text-text flex-1">
                                    <span className="font-medium">Storage cage</span>
                                    <span className="text-text-muted block text-xs">
                                        +${STORAGE_CAGE_COST_PER_WEEK}/week
                                    </span>
                                </span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Cost Summary */}
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <h5 className="text-sm font-semibold text-primary-900 mb-3">
                        Total Cost Summary
                    </h5>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-text-muted">Base rent:</span>
                            <span className="text-text font-medium">
                                ${adjustedBaseRent.toFixed(2)}/week
                            </span>
                        </div>

                        {addOns.furnitureSelected &&
                            addOns.furniturePaymentOption === "add_to_rent" && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Furniture:</span>
                                    <span className="text-text font-medium">
                                        +${addOnsCosts.furniturePerWeek.toFixed(2)}/week
                                    </span>
                                </div>
                            )}

                        {addOns.billsIncluded && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Bills:</span>
                                <span className="text-text font-medium">
                                    +${addOnsCosts.billsCost}/week
                                </span>
                            </div>
                        )}

                        {addOns.regularCleaningSelected && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Regular cleaning:</span>
                                <span className="text-text font-medium">
                                    +${addOnsCosts.regularCleaningCost}/week
                                </span>
                            </div>
                        )}

                        {!isEntireHome && addOns.carparkSelected && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Carpark:</span>
                                <span className="text-text font-medium">
                                    +${addOnsCosts.carparkCost}/week
                                </span>
                            </div>
                        )}

                        {!isEntireHome && addOns.storageCageSelected && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Storage cage:</span>
                                <span className="text-text font-medium">
                                    +${addOnsCosts.storageCageCost}/week
                                </span>
                            </div>
                        )}

                        <div className="border-t border-primary-300 pt-2 mt-2 flex justify-between">
                            <span className="font-semibold text-primary-900">Total weekly:</span>
                            <span className="font-bold text-primary-900 text-lg">
                                ${totalWeeklyRent.toFixed(2)}/week
                            </span>
                        </div>

                        {((addOns.furnitureSelected &&
                            addOns.furniturePaymentOption === "pay_total") ||
                            addOns.regularCleaningSelected) && (
                            <div className="border-t border-primary-300 pt-2 mt-2">
                                <div className="text-xs font-medium text-text-muted mb-2">
                                    One-time fees:
                                </div>
                                {addOns.furnitureSelected &&
                                    addOns.furniturePaymentOption === "pay_total" && (
                                        <div className="flex justify-between">
                                            <span className="text-text-muted">Furniture:</span>
                                            <span className="text-text font-medium">
                                                ${addOnsCosts.furnitureCost}
                                            </span>
                                        </div>
                                    )}
                                <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-primary-200">
                                    <span className="text-primary-900">Total one-time:</span>
                                    <span className="text-primary-900">${addOnsCosts.total}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button variant="secondary" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleNext} className="flex-1">
                        Next: Application Form
                        <Icon name="chevron-right" className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
