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

interface PropertySidebarProps {
    selectedUnit: Unit | null;
    property: Property;
}

export function PropertySidebar({ selectedUnit, property }: PropertySidebarProps) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const isEntireHome = selectedUnit?.listing_type === "entire_home";

    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isAddOnsReviewModalOpen, setIsAddOnsReviewModalOpen] = useState(false);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

    const getDefaultStartDate = () =>
        selectedUnit?.available_from || new Date().toISOString().split("T")[0] || "";

    // Single shared state for sidebar + modal.
    const [addOns, setAddOns] = useState<AddOnsData>({
        furnitureSelected: false,
        furniturePaymentOption: null,
        billsIncluded: false,
        regularCleaningSelected: false,
        selectedLease: 12,
        selectedStartDate: getDefaultStartDate(),
        isDualOccupancy: false,
        entireHomeOccupants: 1,
        carparkSelected: false,
        storageCageSelected: false,
    });

    // Lease period and start date state are managed in addOns state.

    // Occupancy only applies to non-entire-home rooms that support 2 occupants.
    const occupancyApplies = !isEntireHome && selectedUnit?.max_occupants === 2;

    // If occupancy doesn't apply (e.g., single rooms), always treat as single occupancy
    // for pricing calculations like cleaning (+$35/wk) vs dual (+$60/wk).
    const effectiveIsDualOccupancy =
        occupancyApplies && !isEntireHome ? addOns.isDualOccupancy : false;

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

        let baseRent = selectedUnit.price_per_week;

        // Add $100 for dual occupancy rooms
        if (!isEntireHome && effectiveIsDualOccupancy) {
            baseRent += 100;
        }

        switch (addOns.selectedLease) {
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
    }, [selectedUnit, addOns.selectedLease, isEntireHome, effectiveIsDualOccupancy]);

    // Calculate adjusted bond (4 times the adjusted base rent)
    const adjustedBond = useMemo(() => {
        if (!selectedUnit) return 0;

        let baseRent = selectedUnit.price_per_week;

        // Add $100 for dual occupancy rooms
        if (!isEntireHome && effectiveIsDualOccupancy) {
            baseRent += 100;
        }

        // Bond is 4 times the base weekly rent (before lease period adjustments)
        return baseRent * 4;
    }, [selectedUnit, isEntireHome, effectiveIsDualOccupancy]);

    // Calculate add-ons costs
    const addOnsCosts = useMemo(() => {
        if (!selectedUnit) {
            return {
                furnitureCost: 0,
                billsCost: 0,
                regularCleaningCost: 0,
                carparkCost: 0,
                storageCageCost: 0,
                total: 0,
                furniturePerWeek: 0,
            };
        }

        let furnitureCost = 0;
        let furniturePerWeek = 0;

        // Furniture add-on calculation
        if (addOns.furnitureSelected && addOns.furniturePaymentOption) {
            // For entire homes: use full $1500
            // For individual rooms: divide $1500 by number of rooms
            const effectiveFurnitureCost = isEntireHome
                ? FURNITURE_COST
                : getRoomFurnitureCost(property.units || [], FURNITURE_COST);

            if (addOns.furniturePaymentOption === "pay_total") {
                furnitureCost = effectiveFurnitureCost;
            } else if (addOns.furniturePaymentOption === "add_to_rent") {
                // Calculate furniture cost per week based on selected lease period
                // Convert months to weeks (approximately 4.33 weeks per month)
                const leaseWeeks = addOns.selectedLease * 4.33;
                furniturePerWeek = effectiveFurnitureCost / leaseWeeks;
            }
        }

        const billsCost = addOns.billsIncluded ? getBillsCostPerWeek(property.bedrooms) : 0;

        // Calculate cleaning costs based on property type
        let regularCleaningCost = 0;

        if (addOns.regularCleaningSelected) {
            if (isEntireHome) {
                // For entire homes: calculate based on all units/rooms and their max_occupants
                const cleaningCosts = getEntireHomeCleaningCosts(property.units || []);
                regularCleaningCost = cleaningCosts.regularWeekly;
            } else {
                // For single rooms: $35/week regular for single, $60/week for dual occupancy
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
        isEntireHome,
        selectedUnit,
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
    ]);

    // Calculate total weekly rent with add-ons
    const totalWeeklyRent = useMemo(() => {
        if (!selectedUnit) return 0;
        return (
            adjustedBaseRent +
            addOnsCosts.furniturePerWeek +
            addOnsCosts.billsCost +
            addOnsCosts.regularCleaningCost +
            addOnsCosts.carparkCost +
            addOnsCosts.storageCageCost
        );
    }, [
        selectedUnit,
        adjustedBaseRent,
        addOnsCosts.furniturePerWeek,
        addOnsCosts.billsCost,
        addOnsCosts.regularCleaningCost,
        addOnsCosts.carparkCost,
        addOnsCosts.storageCageCost,
    ]);

    return (
        <div className="space-y-4">
            {/* Top Section - Price and Actions */}
            <div className="bg-white border border-border rounded-lg p-4 sm:p-6 shadow-lg">
                {selectedUnit && (
                    <div className="mb-6">
                        {/* Price and Share/Like Buttons Row */}
                        <div className="flex items-start justify-between gap-4">
                            {/* Price Section */}
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-text-muted mb-1">
                                    {selectedUnit.name}
                                </h3>
                                <p className="text-3xl font-bold text-primary-600">
                                    ${adjustedBaseRent.toFixed(2)}
                                    <span className="text-base font-normal text-text-muted">
                                        /week
                                    </span>
                                </p>
                                {addOns.selectedLease !== 12 && (
                                    <p className="text-xs text-text-muted mt-1">
                                        Base: ${selectedUnit.price_per_week}/week (12 months)
                                    </p>
                                )}
                                <p className="text-sm text-text-muted mt-1">
                                    Bond: ${adjustedBond.toFixed(2)}
                                </p>
                            </div>

                            {/* Share and Like Buttons */}
                            <div className="flex gap-2">
                                <ShareDropdown
                                    propertyTitle={property.title}
                                    propertyId={property.id}
                                    unitId={selectedUnit?.id || ""}
                                />
                                <button
                                    onClick={handleToggleLike}
                                    disabled={
                                        !activeUnitId ||
                                        isLikeLoading ||
                                        toggleLikeMutation.isPending
                                    }
                                    className={`p-2 rounded-full transition-all touch-manipulation active:scale-95 ${
                                        isLiked
                                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                                            : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500"
                                    } ${
                                        !activeUnitId ||
                                        isLikeLoading ||
                                        toggleLikeMutation.isPending
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
                        </div>

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
                            <div className="mt-4 pt-4 border-t border-gray-300">
                                <div className="grid grid-cols-2 gap-3">
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
                                            value={addOns.selectedStartDate}
                                            onChange={(e) =>
                                                setAddOns((prev) => ({
                                                    ...prev,
                                                    selectedStartDate: e.target.value,
                                                }))
                                            }
                                            min={
                                                selectedUnit.available_from ||
                                                new Date().toISOString().split("T")[0]
                                            }
                                            max={selectedUnit.available_to || undefined}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label
                                            htmlFor="leasePeriod"
                                            className="block text-xs font-medium text-text-muted mb-1"
                                        >
                                            Lease Period (months)
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="leasePeriod"
                                                value={addOns.selectedLease}
                                                onChange={(e) =>
                                                    setAddOns((prev) => ({
                                                        ...prev,
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
                                </div>

                                {/* Occupancy Toggle - Only for rooms with max 2 occupants */}
                                {occupancyApplies && (
                                    <div>
                                        <label className="block text-xs font-medium text-text-muted mb-2">
                                            Occupancy Type
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAddOns((prev) => ({
                                                        ...prev,
                                                        isDualOccupancy: false,
                                                    }))
                                                }
                                                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
                                                    !addOns.isDualOccupancy
                                                        ? "bg-primary-600 text-white border-primary-600 font-medium"
                                                        : "bg-white text-text border-gray-300 hover:border-primary-400"
                                                }`}
                                            >
                                                Single
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAddOns((prev) => ({
                                                        ...prev,
                                                        isDualOccupancy: true,
                                                    }))
                                                }
                                                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
                                                    addOns.isDualOccupancy
                                                        ? "bg-primary-600 text-white border-primary-600 font-medium"
                                                        : "bg-white text-text border-gray-300 hover:border-primary-400"
                                                }`}
                                            >
                                                Dual Occupancy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!selectedUnit && (
                    <div className="mb-6">
                        {/* Share and Like Buttons when no unit selected */}
                        <div className="flex justify-end gap-2 mb-4">
                            <ShareDropdown
                                propertyTitle={property.title}
                                propertyId={property.id}
                                unitId=""
                            />
                            <button
                                onClick={handleToggleLike}
                                disabled={
                                    !activeUnitId || isLikeLoading || toggleLikeMutation.isPending
                                }
                                className={`p-2 rounded-full transition-all touch-manipulation active:scale-95 ${
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
                        <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 text-gray-500 font-medium text-sm">
                                <Icon name="dot" className="w-4 h-4" />
                                Availability will be updated
                            </div>
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
                                // Show add-ons review modal first for all units (both rooms and entire homes)
                                setIsAddOnsReviewModalOpen(true);
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

            {/* Bottom Section - Add-ons */}
            {selectedUnit && (
                <div className="bg-white border border-border rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-text mb-4">Customize Your Stay</h3>

                    <div className="space-y-4">
                        {/* Furniture Add-on - Only if property is unfurnished */}
                        {!property.furnished && (
                            <div className="space-y-2">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={addOns.furnitureSelected}
                                        onChange={(e) => {
                                            setAddOns((prev) => ({
                                                ...prev,
                                                furnitureSelected: e.target.checked,
                                                furniturePaymentOption:
                                                    e.target.checked &&
                                                    prev.furniturePaymentOption === null
                                                        ? "add_to_rent"
                                                        : prev.furniturePaymentOption,
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

                                {/* Payment options for furniture */}
                                {addOns.furnitureSelected && (
                                    <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-md">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="furniturePayment"
                                                checked={
                                                    addOns.furniturePaymentOption === "add_to_rent"
                                                }
                                                onChange={() =>
                                                    setAddOns((prev) => ({
                                                        ...prev,
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
                                                name="furniturePayment"
                                                checked={
                                                    addOns.furniturePaymentOption === "pay_total"
                                                }
                                                onChange={() =>
                                                    setAddOns((prev) => ({
                                                        ...prev,
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
                                    setAddOns((prev) => ({
                                        ...prev,
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
                                    setAddOns((prev) => ({
                                        ...prev,
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
                                        setAddOns((prev) => ({
                                            ...prev,
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
                                        setAddOns((prev) => ({
                                            ...prev,
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

                    {/* Cost Summary */}
                    {(addOns.furnitureSelected ||
                        addOns.billsIncluded ||
                        addOns.regularCleaningSelected ||
                        addOns.carparkSelected ||
                        addOns.storageCageSelected) && (
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
                                    <span className="font-semibold text-primary-900">
                                        Total weekly:
                                    </span>
                                    <span className="font-bold text-primary-900 text-lg">
                                        ${totalWeeklyRent.toFixed(2)}/week
                                    </span>
                                </div>

                                {addOns.furnitureSelected &&
                                    addOns.furniturePaymentOption === "pay_total" && (
                                        <div className="border-t border-primary-300 pt-2 mt-2">
                                            <div className="text-xs font-medium text-text-muted mb-2">
                                                One-time fees:
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-muted">Furniture:</span>
                                                <span className="text-text font-medium">
                                                    ${addOnsCosts.furnitureCost}
                                                </span>
                                            </div>
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
            {selectedUnit && (
                <AddOnsReviewModal
                    isOpen={isAddOnsReviewModalOpen}
                    onClose={() => setIsAddOnsReviewModalOpen(false)}
                    onChange={(next) => setAddOns(next)}
                    onNext={() => {
                        // Close add-ons modal and open application form
                        setIsAddOnsReviewModalOpen(false);
                        setIsApplicationModalOpen(true);
                    }}
                    property={property}
                    selectedUnit={selectedUnit}
                    selectedLease={addOns.selectedLease}
                    isEntireHome={isEntireHome}
                    addOns={{
                        ...addOns,
                        // Ensure the modal reflects the effective value used for pricing.
                        // This prevents stale dual-occupancy state from showing up for single rooms.
                        isDualOccupancy: effectiveIsDualOccupancy,
                        // Keep start date non-empty when unit changes.
                        selectedStartDate: addOns.selectedStartDate || getDefaultStartDate(),
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
