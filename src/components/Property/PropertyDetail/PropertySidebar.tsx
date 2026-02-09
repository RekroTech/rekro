"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Unit } from "@/types/db";
import type { Property } from "@/types/property.types";
import { Button, Icon } from "@/components/common";
import { useAuth } from "@/lib/react-query/hooks/auth/useAuth";
import { useToggleUnitLike, useUnitLike } from "@/lib/react-query/hooks/property";
import { ApplicationForm } from "../ApplicationForm";
import { EnquiryModal } from "./EnquiryModal";
import { ShareDropdown } from "./ShareDropdown";
import { AddOnsReviewModal, AddOnsData } from "./AddOnsReviewModal";
import { FurniturePaymentOption } from "@/components/Property/types";
import { getBillsCostPerWeek } from "@/components/Property/utils";
import { CLEANING_COST, FURNITURE_COST } from "@/components/Property/constants";

interface PropertySidebarProps {
    selectedUnit: Unit | null;
    isEntireHome: boolean;
    property: Property;
}

export function PropertySidebar({ selectedUnit, isEntireHome, property }: PropertySidebarProps) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isAddOnsReviewModalOpen, setIsAddOnsReviewModalOpen] = useState(false);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

    // Lease period and start date state (period in months: 4, 6, 9, 12)
    const [selectedLease, setSelectedLease] = useState<number>(12);
    const [selectedStartDate, setSelectedStartDate] = useState<string>(
        selectedUnit?.available_from || new Date().toISOString().split("T")[0] || ""
    );

    // Add-ons state (only for room units)
    const [furnitureSelected, setFurnitureSelected] = useState(false);
    const [furniturePaymentOption, setFurniturePaymentOption] =
        useState<FurniturePaymentOption>(null);
    const [billsIncluded, setBillsIncluded] = useState(false);
    const [cleaningSelected, setCleaningSelected] = useState(false);

    const handleLoginRequired = () => {
        router.push(`/login?redirect=/property/${property.id}`);
    };

    // Like functionality - only check for the currently selected unit
    const activeUnitId = selectedUnit?.id;
    const { data: isLiked = false, isLoading: isLikeLoading } = useUnitLike(activeUnitId ?? "", {
        enabled: isAuthenticated && !!activeUnitId,
    });
    const toggleLikeMutation = useToggleUnitLike();

    const handleToggleLike = async () => {
        if (!isAuthenticated) {
            handleLoginRequired();
            return;
        }
        if (!activeUnitId) return;
        if (isLikeLoading) return;

        try {
            await toggleLikeMutation.mutateAsync({ unitId: activeUnitId, currentLiked: isLiked });
        } catch (error) {
            console.error("Error toggling unit like:", error);
        }
    };

    // Get availability data directly from the selected unit
    // Format availability dates
    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Check if available_from is later than today
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison

    const availableFrom = selectedUnit?.available_from
        ? new Date(selectedUnit.available_from)
        : null;
    if (availableFrom) {
        availableFrom.setHours(0, 0, 0, 0);
    }

    const availableTo = selectedUnit?.available_to ? new Date(selectedUnit.available_to) : null;
    if (availableTo) {
        availableTo.setHours(0, 0, 0, 0);
    }

    // Only show "Available from" if it's a future date
    const showAvailableFrom = availableFrom && availableFrom > now;
    const availableFromFormatted = showAvailableFrom
        ? formatDate(selectedUnit?.available_from || null)
        : null;

    // Always show "Available until" if it exists
    const availableToFormatted = formatDate(selectedUnit?.available_to || null);

    // Determine availability status
    const getAvailabilityStatus = () => {
        if (!selectedUnit) return { text: "Availability unknown", color: "text-gray-500" };

        if (!selectedUnit.is_available) {
            return { text: "Not currently available", color: "text-red-600" };
        }

        if (availableFrom && availableFrom > now) {
            return {
                text: `Available from ${formatDate(selectedUnit.available_from || null)}`,
                color: "text-yellow-600",
            };
        }

        return { text: "Available now", color: "text-green-600" };
    };

    const availabilityStatus = getAvailabilityStatus();

    // Calculate adjusted rent based on lease period
    const adjustedBaseRent = useMemo(() => {
        if (!selectedUnit) return 0;

        const baseRent = selectedUnit.price_per_week;

        switch (selectedLease) {
            case 4:
                // 4 months: 1.5 times the 6-month rent
                // First calculate 6-month rent (5% more than 12-month)
                const sixMonthRent = baseRent * 1.05;
                return sixMonthRent * 1.5;
            case 6:
                // 6 months: 5% more than 12-month rent
                return baseRent * 1.05;
            case 9:
                // 9 months: 4/3 times the 12-month rent
                return baseRent * (4 / 3);
            case 12:
            default:
                // 12 months: base rent (no adjustment)
                return baseRent;
        }
    }, [selectedUnit, selectedLease]);

    // Calculate add-ons costs (only for room units)
    const addOnsCosts = useMemo(() => {
        if (isEntireHome || !selectedUnit) {
            return {
                furnitureCost: 0,
                billsCost: 0,
                cleaningCost: 0,
                total: 0,
                furniturePerWeek: 0,
            };
        }

        let furnitureCost = 0;
        let furniturePerWeek = 0;

        if (furnitureSelected && furniturePaymentOption) {
            if (furniturePaymentOption === "pay_total") {
                furnitureCost = FURNITURE_COST;
            } else if (furniturePaymentOption === "add_to_rent") {
                // Calculate furniture cost per week based on selected lease period
                // Convert months to weeks (approximately 4.33 weeks per month)
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
        isEntireHome,
        selectedUnit,
        furnitureSelected,
        furniturePaymentOption,
        billsIncluded,
        cleaningSelected,
        property.bedrooms,
        selectedLease,
    ]);

    // Calculate total weekly rent with add-ons
    const totalWeeklyRent = useMemo(() => {
        if (!selectedUnit) return 0;
        return adjustedBaseRent + addOnsCosts.furniturePerWeek + addOnsCosts.billsCost;
    }, [selectedUnit, adjustedBaseRent, addOnsCosts.furniturePerWeek, addOnsCosts.billsCost]);

    return (
        <div className="col-span-1 space-y-4">
            {/* Top Section - Price and Actions */}
            <div className="bg-white border border-border rounded-lg p-6 shadow-lg sticky top-4">
                {/* Like and Share Buttons - Top Right */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <ShareDropdown
                        propertyTitle={property.title}
                        propertyId={property.id}
                        unitId={selectedUnit?.id || ""}
                    />
                    <button
                        onClick={handleToggleLike}
                        disabled={!activeUnitId || isLikeLoading || toggleLikeMutation.isPending}
                        className={`p-2 rounded-full transition-all ${
                            isLiked
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500"
                        } ${
                            !activeUnitId || isLikeLoading || toggleLikeMutation.isPending
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }`}
                        aria-label={
                            !activeUnitId
                                ? `Select a ${isEntireHome ? "property" : "room"} to save`
                                : isLiked
                                  ? `Unsave ${isEntireHome ? "property" : "room"}`
                                  : `Save ${isEntireHome ? "property" : "room"}`
                        }
                    >
                        <Icon
                            name="heart"
                            className="w-5 h-5"
                            fill={isLiked ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth={isLiked ? 0 : 2}
                        />
                    </button>
                </div>

                {selectedUnit && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-text-muted mb-1">
                            {isEntireHome ? "Price" : "Room Price"}
                        </h3>
                        <p className="text-3xl font-bold text-primary-600">
                            ${adjustedBaseRent.toFixed(2)}
                            <span className="text-base font-normal text-text-muted">/week</span>
                        </p>
                        {selectedLease !== 12 && (
                            <p className="text-xs text-text-muted mt-1">
                                Base: ${selectedUnit.price_per_week}/week (12 months)
                            </p>
                        )}
                        {selectedUnit.bond_amount && (
                            <p className="text-sm text-text-muted mt-1">
                                Bond: ${selectedUnit.bond_amount}
                            </p>
                        )}

                        {/* Availability Information */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-muted">Status:</span>
                                    <span
                                        className={`font-medium ${availabilityStatus.color} inline-flex items-center gap-1.5`}
                                    >
                                        <Icon name="dot" className="w-3 h-3" />
                                        {selectedUnit.is_available ? "Available" : "Not Available"}
                                    </span>
                                </div>
                                {availableFromFormatted && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Available from:</span>
                                        <span className="text-text font-medium">
                                            {availableFromFormatted}
                                        </span>
                                    </div>
                                )}
                                {availableToFormatted && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Available until:</span>
                                        <span className="text-text font-medium">
                                            {availableToFormatted}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Lease Period and Start Date Selection */}
                            <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
                                <div>
                                    <label
                                        htmlFor="startDate"
                                        className="block text-xs font-medium text-text-muted mb-1"
                                    >
                                        Preferred Start Date
                                    </label>
                                    <input
                                        type="date"
                                        id="startDate"
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
                                        htmlFor="leasePeriod"
                                        className="block text-xs font-medium text-text-muted mb-1"
                                    >
                                        Lease Period (months)
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="leasePeriod"
                                            value={selectedLease}
                                            onChange={(e) =>
                                                setSelectedLease(Number(e.target.value))
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
                            </div>
                        </div>
                    </div>
                )}

                {!selectedUnit && (
                    <div className="mb-6 flex items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 text-gray-500 font-medium text-sm">
                            <Icon name="dot" className="w-4 h-4" />
                            Availability will be updated
                        </div>
                    </div>
                )}

                <h3 className="text-xl font-bold text-text mb-4">Interested?</h3>
                <p className="text-text-muted mb-6">
                    Get in touch to know more or apply now to secure this{" "}
                    {isEntireHome ? "property" : "room"}.
                </p>

                <div className="space-y-3">
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setIsEnquiryModalOpen(true)}
                    >
                        <Icon name="mail" className="w-5 h-5 mr-2" />
                        Enquire Now
                    </Button>

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => {
                            if (!isAuthenticated) {
                                handleLoginRequired();
                            } else {
                                // For room units, show add-ons review modal first
                                // For entire homes, go directly to application form
                                if (!isEntireHome) {
                                    setIsAddOnsReviewModalOpen(true);
                                } else {
                                    setIsApplicationModalOpen(true);
                                }
                            }
                        }}
                    >
                        <Icon name="document" className="w-5 h-5 mr-2" />
                        {isAuthenticated ? "Apply" : "Login to Apply"}
                    </Button>
                </div>

                {!isAuthenticated && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                            <Icon name="info" className="w-4 h-4 inline mr-1" />
                            Create an account to save properties and apply
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom Section - Add-ons (Only for room units) */}
            {!isEntireHome && selectedUnit && (
                <div className="bg-white border border-border rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-text mb-4">Customize Your Stay</h3>

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

                                {/* Payment options for furniture */}
                                {furnitureSelected && (
                                    <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-md">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="furniturePayment"
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
                                                name="furniturePayment"
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

                    {/* Cost Summary */}
                    {(furnitureSelected || billsIncluded || cleaningSelected) && (
                        <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                            <h5 className="text-sm font-semibold text-primary-900 mb-3">
                                Cost Summary
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
                                    <span className="font-semibold text-primary-900">
                                        Total weekly:
                                    </span>
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
                                        {furnitureSelected &&
                                            furniturePaymentOption === "pay_total" && (
                                                <div className="flex justify-between">
                                                    <span className="text-text-muted">
                                                        Furniture:
                                                    </span>
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
                                            <span className="text-primary-900">
                                                Total one-time:
                                            </span>
                                            <span className="text-primary-900">
                                                ${addOnsCosts.total}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add-ons Review Modal - Only for room units */}
            {!isEntireHome && selectedUnit && (
                <AddOnsReviewModal
                    isOpen={isAddOnsReviewModalOpen}
                    onClose={() => setIsAddOnsReviewModalOpen(false)}
                    onNext={(addOns: AddOnsData) => {
                        // Update the add-ons state with user's selections
                        setFurnitureSelected(addOns.furnitureSelected);
                        setFurniturePaymentOption(addOns.furniturePaymentOption);
                        setBillsIncluded(addOns.billsIncluded);
                        setCleaningSelected(addOns.cleaningSelected);
                        setSelectedLease(addOns.selectedLease);
                        setSelectedStartDate(addOns.selectedStartDate);

                        // Close add-ons modal and open application form
                        setIsAddOnsReviewModalOpen(false);
                        setIsApplicationModalOpen(true);
                    }}
                    property={property}
                    selectedUnit={selectedUnit}
                    selectedLease={selectedLease}
                    initialAddOns={{
                        furnitureSelected,
                        furniturePaymentOption,
                        billsIncluded,
                        cleaningSelected,
                        selectedLease,
                        selectedStartDate,
                    }}
                />
            )}

            <EnquiryModal
                isOpen={isEnquiryModalOpen}
                onClose={() => setIsEnquiryModalOpen(false)}
                propertyTitle={property.title}
                propertyId={property.id}
                unitId={selectedUnit?.id}
                isEntireHome={isEntireHome}
            />

            <ApplicationForm
                isOpen={isApplicationModalOpen}
                onClose={() => setIsApplicationModalOpen(false)}
                propertyTitle={property.title}
                propertyId={property.id}
                unitId={selectedUnit?.id}
                isEntireHome={isEntireHome}
            />
        </div>
    );
}
