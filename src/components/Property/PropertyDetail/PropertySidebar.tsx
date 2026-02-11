"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, startOfDay, parseISO } from "date-fns";
import type { Unit } from "@/types/db";
import type { Property } from "@/types/property.types";
import { Button, Icon, Input, Select } from "@/components/common";
import { useAuth } from "@/lib/react-query/hooks/auth/useAuth";
import { useToggleUnitLike, useUnitLike } from "@/lib/react-query/hooks/property";
import { EnquiryForm } from "./EnquiryForm";
import { ShareDropdown } from "./ShareDropdown";
import { ApplicationModal } from "./ApplicationModal";
import { Inclusions } from "./Inclusions/Inclusions";
import { InclusionsData } from "@/components/Property/types";
import { calculatePricing } from "@/components/Property/utils";

interface PropertySidebarProps {
    selectedUnit: Unit | null;
    property: Property;
}

export function PropertySidebar({ selectedUnit, property }: PropertySidebarProps) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const isEntireHome = selectedUnit?.listing_type === "entire_home";

    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

    const getDefaultStartDate = () =>
        selectedUnit?.available_from || new Date().toISOString().split("T")[0] || "";

    // Single state for all inclusions/pricing selections
    const [inclusions, setInclusions] = useState<InclusionsData>({
        furnitureSelected: false,
        billsIncluded: false,
        regularCleaningSelected: false,
        selectedLease: 12,
        selectedStartDate: getDefaultStartDate(),
        isDualOccupancy: false,
        entireHomeOccupants: 1,
        carparkSelected: false,
        storageCageSelected: false,
    });

    // Reset dual occupancy when switching units that don't support it
    const canBeDual = !isEntireHome && selectedUnit?.max_occupants === 2;
    useEffect(() => {
        if (!canBeDual && inclusions.isDualOccupancy) {
            // Use queueMicrotask to avoid cascading renders
            queueMicrotask(() => {
                setInclusions((prev) => ({ ...prev, isDualOccupancy: false }));
            });
        }
    }, [canBeDual, inclusions.isDualOccupancy]);

    // Calculate all pricing in one place
    const pricing = useMemo(
        () => calculatePricing({ selectedUnit, property, inclusions }),
        [selectedUnit, property, inclusions]
    );

    const handleLoginRequired = () => {
        router.push(`/login?redirect=/property/${property.id}`);
    };

    // Format dates for display using date-fns
    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        try {
            return format(parseISO(dateString), "MMM d, yyyy");
        } catch {
            return null;
        }
    };

    // Check availability dates
    const now = startOfDay(new Date());
    const availableFrom = selectedUnit?.available_from
        ? startOfDay(parseISO(selectedUnit.available_from))
        : null;

    const showAvailableFrom = availableFrom && availableFrom > now;
    const availableFromFormatted = showAvailableFrom
        ? formatDate(selectedUnit?.available_from || null)
        : null;
    const availableToFormatted = formatDate(selectedUnit?.available_to || null);

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
    const canShowDualOccupancy = !isEntireHome && selectedUnit?.max_occupants === 2;

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
                                    ${pricing.totalWeeklyRent.toFixed(2)}
                                    <span className="text-base font-normal text-text-muted">
                                        /week
                                    </span>
                                </p>
                                <p className="text-sm text-text-muted mt-1">
                                    Bond: ${pricing.bond.toFixed(2)}
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
                        </div>

                        {/* Lease Period and Start Date Selection */}
                        <div className="mt-6 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Input
                                        type="date"
                                        id="startDate"
                                        label="Preferred Start Date"
                                        value={inclusions.selectedStartDate}
                                        onChange={(e) =>
                                            setInclusions((prev) => ({
                                                ...prev,
                                                selectedStartDate: e.target.value,
                                            }))
                                        }
                                        min={
                                            selectedUnit.available_from ||
                                            new Date().toISOString().split("T")[0]
                                        }
                                        max={selectedUnit.available_to || undefined}
                                        size="sm"
                                        fullWidth
                                    />
                                </div>

                                <div>
                                    <Select
                                        id="leasePeriod"
                                        label="Lease Period"
                                        value={inclusions.selectedLease.toString()}
                                        onChange={(e) =>
                                            setInclusions((prev) => ({
                                                ...prev,
                                                selectedLease: Number(e.target.value),
                                            }))
                                        }
                                        options={[
                                            { value: "4", label: "4 months" },
                                            { value: "6", label: "6 months" },
                                            { value: "9", label: "9 months" },
                                            { value: "12", label: "12 months" },
                                        ]}
                                        size="sm"
                                        fullWidth
                                    />
                                </div>
                            </div>

                            {/* Occupancy Toggle - Only for rooms with max 2 occupants */}
                            {canShowDualOccupancy && (
                                <div>
                                    <label className="block text-xs font-medium text-text-muted mb-2">
                                        Occupancy Type
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setInclusions((prev) => ({
                                                    ...prev,
                                                    isDualOccupancy: false,
                                                }))
                                            }
                                            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
                                                !inclusions.isDualOccupancy
                                                    ? "bg-primary-600 text-white border-primary-600 font-medium"
                                                    : "bg-white text-text border-gray-300 hover:border-primary-400"
                                            }`}
                                        >
                                            Single
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setInclusions((prev) => ({
                                                    ...prev,
                                                    isDualOccupancy: true,
                                                }))
                                            }
                                            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
                                                inclusions.isDualOccupancy
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
                                // Show unified application modal (add-ons + application form)
                                setIsApplicationModalOpen(true);
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
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-text">Customize your stay</h3>
                        </div>
                    </div>

                    <Inclusions
                        property={property}
                        inclusions={inclusions}
                        onChange={(next) => setInclusions(next)}
                        isEntireHome={isEntireHome}
                        effectiveIsDualOccupancy={pricing.isDualOccupancy}
                    />
                </div>
            )}

            {/* Unified Application Modal - Add-ons + Application Form */}
            {selectedUnit && (
                <ApplicationModal
                    isOpen={isApplicationModalOpen}
                    onClose={() => setIsApplicationModalOpen(false)}
                    property={property}
                    selectedUnit={selectedUnit}
                    inclusions={{
                        ...inclusions,
                        isDualOccupancy: pricing.isDualOccupancy,
                        selectedStartDate: inclusions.selectedStartDate || getDefaultStartDate(),
                    }}
                    onChange={(next) => setInclusions(next)}
                    isEntireHome={isEntireHome}
                />
            )}

            <EnquiryForm
                isOpen={isEnquiryModalOpen}
                onClose={() => setIsEnquiryModalOpen(false)}
                propertyTitle={property.title}
                propertyId={property.id}
                unitId={selectedUnit?.id}
                isEntireHome={isEntireHome}
            />
        </div>
    );
}
