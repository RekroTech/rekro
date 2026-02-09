"use client";

import { useState, useMemo } from "react";
import { Modal, Button, Icon } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { FurniturePaymentOption } from "@/components/Property/types";
import { getBillsCostPerWeek } from "@/components/Property/utils";
import { CLEANING_COST, FURNITURE_COST } from "@/components/Property/constants";

interface AddOnsReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNext: (addOns: AddOnsData) => void;
    property: Property;
    selectedUnit: Unit;
    selectedLease: number;
    initialAddOns?: AddOnsData;
}

export interface AddOnsData {
    furnitureSelected: boolean;
    furniturePaymentOption: FurniturePaymentOption;
    billsIncluded: boolean;
    cleaningSelected: boolean;
    selectedLease: number;
    selectedStartDate: string;
}

export function AddOnsReviewModal({
    isOpen,
    onClose,
    onNext,
    property,
    selectedUnit,
    selectedLease: initialLease,
    initialAddOns,
}: AddOnsReviewModalProps) {
    // Local state for add-ons
    const [furnitureSelected, setFurnitureSelected] = useState(
        initialAddOns?.furnitureSelected ?? false
    );
    const [furniturePaymentOption, setFurniturePaymentOption] = useState<FurniturePaymentOption>(
        initialAddOns?.furniturePaymentOption ?? null
    );
    const [billsIncluded, setBillsIncluded] = useState(initialAddOns?.billsIncluded ?? false);
    const [cleaningSelected, setCleaningSelected] = useState(
        initialAddOns?.cleaningSelected ?? false
    );
    const [selectedLease, setSelectedLease] = useState(
        initialAddOns?.selectedLease ?? initialLease
    );
    const [selectedStartDate, setSelectedStartDate] = useState(
        initialAddOns?.selectedStartDate ??
            selectedUnit?.available_from ??
            new Date().toISOString().split("T")[0] ??
            ""
    );

    // Calculate adjusted rent based on lease period
    const adjustedBaseRent = useMemo(() => {
        const baseRent = selectedUnit.price_per_week;

        switch (selectedLease) {
            case 4:
                const sixMonthRent = baseRent * 1.05;
                return sixMonthRent * 1.5;
            case 6:
                return baseRent * 1.05;
            case 9:
                return baseRent * (4 / 3);
            case 12:
            default:
                return baseRent;
        }
    }, [selectedUnit, selectedLease]);

    // Calculate add-ons costs
    const addOnsCosts = useMemo(() => {
        let furnitureCost = 0;
        let furniturePerWeek = 0;

        if (furnitureSelected && furniturePaymentOption) {
            if (furniturePaymentOption === "pay_total") {
                furnitureCost = FURNITURE_COST;
            } else if (furniturePaymentOption === "add_to_rent") {
                const leaseWeeks = selectedLease * 4.33;
                furniturePerWeek = FURNITURE_COST / leaseWeeks;
            }
        }

        const billsCost = billsIncluded ? getBillsCostPerWeek(property.bedrooms) : 0;
        const cleaningCost = cleaningSelected ? CLEANING_COST : 0;

        return {
            furnitureCost,
            billsCost,
            cleaningCost,
            total: furnitureCost + cleaningCost,
            furniturePerWeek,
        };
    }, [
        furnitureSelected,
        furniturePaymentOption,
        billsIncluded,
        cleaningSelected,
        property.bedrooms,
        selectedLease,
    ]);

    // Calculate total weekly rent
    const totalWeeklyRent = useMemo(() => {
        return adjustedBaseRent + addOnsCosts.furniturePerWeek + addOnsCosts.billsCost;
    }, [adjustedBaseRent, addOnsCosts.furniturePerWeek, addOnsCosts.billsCost]);

    const handleNext = () => {
        onNext({
            furnitureSelected,
            furniturePaymentOption,
            billsIncluded,
            cleaningSelected,
            selectedLease,
            selectedStartDate,
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
                                value={selectedStartDate}
                                onChange={(e) => setSelectedStartDate(e.target.value)}
                                min={
                                    selectedUnit.available_from ||
                                    new Date().toISOString().split("T")[0]
                                }
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
                                    value={selectedLease}
                                    onChange={(e) => setSelectedLease(Number(e.target.value))}
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
                                        checked={furnitureSelected}
                                        onChange={(e) => {
                                            setFurnitureSelected(e.target.checked);
                                            if (!e.target.checked) {
                                                setFurniturePaymentOption(null);
                                            }
                                        }}
                                        className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-text flex-1">
                                        <span className="font-medium">Furnished package</span>
                                        <span className="text-text-muted block text-xs">
                                            ${FURNITURE_COST} total
                                        </span>
                                    </span>
                                </label>

                                {furnitureSelected && (
                                    <div className="ml-6 space-y-2 p-3 bg-white rounded-md border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="modalFurniturePayment"
                                                checked={furniturePaymentOption === "add_to_rent"}
                                                onChange={() =>
                                                    setFurniturePaymentOption("add_to_rent")
                                                }
                                                className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-text">
                                                Add to rent{" "}
                                                <span className="text-text-muted">
                                                    ($
                                                    {(
                                                        FURNITURE_COST /
                                                        (selectedLease * 4.33)
                                                    ).toFixed(2)}
                                                    /week)
                                                </span>
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="modalFurniturePayment"
                                                checked={furniturePaymentOption === "pay_total"}
                                                onChange={() =>
                                                    setFurniturePaymentOption("pay_total")
                                                }
                                                className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-text">
                                                Pay total upfront{" "}
                                                <span className="text-text-muted">
                                                    (${FURNITURE_COST})
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
                                checked={billsIncluded}
                                onChange={(e) => setBillsIncluded(e.target.checked)}
                                className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-sm text-text flex-1">
                                <span className="font-medium">Bills included</span>
                                <span className="text-text-muted block text-xs">
                                    +${getBillsCostPerWeek(property.bedrooms)}/week
                                </span>
                            </span>
                        </label>

                        {/* Cleaning Add-on */}
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={cleaningSelected}
                                onChange={(e) => setCleaningSelected(e.target.checked)}
                                className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-sm text-text flex-1">
                                <span className="font-medium">Cleaning service</span>
                                <span className="text-text-muted block text-xs">
                                    Regular + end of lease (${CLEANING_COST})
                                </span>
                            </span>
                        </label>
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

                        {furnitureSelected && furniturePaymentOption === "add_to_rent" && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Furniture:</span>
                                <span className="text-text font-medium">
                                    +${addOnsCosts.furniturePerWeek.toFixed(2)}/week
                                </span>
                            </div>
                        )}

                        {billsIncluded && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Bills:</span>
                                <span className="text-text font-medium">
                                    +${addOnsCosts.billsCost}/week
                                </span>
                            </div>
                        )}

                        <div className="border-t border-primary-300 pt-2 mt-2 flex justify-between">
                            <span className="font-semibold text-primary-900">Total weekly:</span>
                            <span className="font-bold text-primary-900 text-lg">
                                ${totalWeeklyRent.toFixed(2)}/week
                            </span>
                        </div>

                        {((furnitureSelected && furniturePaymentOption === "pay_total") ||
                            cleaningSelected) && (
                            <div className="border-t border-primary-300 pt-2 mt-2">
                                <div className="text-xs font-medium text-text-muted mb-2">
                                    One-time fees:
                                </div>
                                {furnitureSelected && furniturePaymentOption === "pay_total" && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Furniture:</span>
                                        <span className="text-text font-medium">
                                            ${addOnsCosts.furnitureCost}
                                        </span>
                                    </div>
                                )}
                                {cleaningSelected && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Cleaning:</span>
                                        <span className="text-text font-medium">
                                            ${addOnsCosts.cleaningCost}
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
