"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { getAvailabilityInfo, getMaxStartDate, getMinStartDate } from "@/components/Property/utils";
import { calculatePricing } from "@/components/Property/pricing";

interface PropertySidebarProps {
    selectedUnit: Unit | null;
    property: Property;
    // Optional external state for unit occupancies (for synchronizing with UnitsSelector)
    unitOccupancies?: Record<string, number>;
    onUnitOccupanciesChange?: (occupancies: Record<string, number>) => void;
}

export function PropertySidebar({
    selectedUnit,
    property,
    unitOccupancies: externalUnitOccupancies,
    onUnitOccupanciesChange,
}: PropertySidebarProps) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const isEntireHome = selectedUnit?.listing_type === "entire_home";

    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

    // Simplified inclusions state with automatic initialization
    const [inclusions, setInclusions] = useState<InclusionsData>(() => ({
        furnitureSelected: !isEntireHome,
        billsIncluded: !isEntireHome,
        regularCleaningSelected: false,
        selectedLease: 12,
        selectedStartDate: getMinStartDate(selectedUnit?.available_from),
        isDualOccupancy: false,
        entireHomeOccupants: 1,
        carparkSelected: false,
        storageCageSelected: false,
        unitOccupancies:
            externalUnitOccupancies ||
            property.units?.reduce(
                (acc, unit) => {
                    acc[unit.id] = 1; // Initialize all units to single occupancy
                    return acc;
                },
                {} as Record<string, number>
            ),
    }));

    // Sync with external unitOccupancies if provided
    useEffect(() => {
        if (externalUnitOccupancies) {
            // Use functional update to avoid cascading renders
            const timeoutId = setTimeout(() => {
                setInclusions((prev) => ({
                    ...prev,
                    unitOccupancies: externalUnitOccupancies,
                    // Update isDualOccupancy based on current unit's occupancy
                    isDualOccupancy: selectedUnit
                        ? externalUnitOccupancies[selectedUnit.id] === 2
                        : prev.isDualOccupancy,
                }));
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [externalUnitOccupancies, selectedUnit]);

    // Update state when unit changes
    useEffect(() => {
        if (!selectedUnit) return;

        // Use functional update to avoid cascading renders
        const timeoutId = setTimeout(() => {
            setInclusions((prev) => ({
                ...prev,
                selectedStartDate: getMinStartDate(selectedUnit.available_from),
                // Reset dual occupancy if new unit doesn't support it
                isDualOccupancy:
                    prev.isDualOccupancy && selectedUnit.max_occupants === 2
                        ? prev.isDualOccupancy
                        : false,
                // Ensure unitOccupancies is initialized for all units
                unitOccupancies:
                    externalUnitOccupancies ||
                    property.units?.reduce(
                        (acc, unit) => {
                            acc[unit.id] = prev.unitOccupancies?.[unit.id] || 1;
                            return acc;
                        },
                        {} as Record<string, number>
                    ),
            }));
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [selectedUnit, property.units, externalUnitOccupancies]);

    // Calculate pricing
    const pricing = useMemo(
        () => calculatePricing({ selectedUnit, property, inclusions }),
        [selectedUnit, property, inclusions]
    );

    const handleLoginRequired = () => {
        router.push(`/login?redirect=/property/${property.id}`);
    };

    // Get availability info
    const availability = useMemo(() => getAvailabilityInfo(selectedUnit), [selectedUnit]);

    // Like functionality
    const { data: isLiked = false, isLoading: isLikeLoading } = useUnitLike(
        selectedUnit?.id ?? "",
        {
            enabled: isAuthenticated && !!selectedUnit?.id,
        }
    );
    const toggleLikeMutation = useToggleUnitLike();

    const handleToggleLike = async () => {
        if (!isAuthenticated) {
            handleLoginRequired();
            return;
        }
        if (!selectedUnit?.id || isLikeLoading) return;

        try {
            await toggleLikeMutation.mutateAsync({
                unitId: selectedUnit.id,
                currentLiked: isLiked,
            });
        } catch (error) {
            console.error("Error toggling unit like:", error);
        }
    };

    const canShowDualOccupancy = !isEntireHome && selectedUnit?.max_occupants === 2;

    // Reusable like button JSX
    const likeButton = (
        <button
            onClick={handleToggleLike}
            disabled={!selectedUnit?.id || isLikeLoading || toggleLikeMutation.isPending}
            className={`p-2 rounded-full transition-all touch-manipulation active:scale-95 ${
                isLiked
                    ? "bg-danger-500/10 text-danger-500 hover:bg-danger-500/20"
                    : "bg-surface-muted text-text-muted hover:bg-surface-subtle hover:text-danger-500"
            } ${
                !selectedUnit?.id || isLikeLoading || toggleLikeMutation.isPending
                    ? "opacity-50 cursor-not-allowed"
                    : ""
            }`}
            aria-label={
                !selectedUnit?.id
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
    );

    return (
        <div className="space-y-4">
            {/* Top Section - Price and Actions */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-lg">
                {selectedUnit ? (
                    <div className="mb-6">
                        {/* Price and Action Buttons */}
                        <div className="flex items-start justify-between gap-4">
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

                            <div className="flex gap-2">
                                <ShareDropdown
                                    propertyTitle={property.title}
                                    propertyId={property.id}
                                    unitId={selectedUnit.id}
                                />
                                {likeButton}
                            </div>
                        </div>

                        {/* Availability Information */}
                        <div className="mt-4 p-3 bg-surface-subtle rounded-lg border border-border">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-muted">Status:</span>
                                    <span
                                        className={`font-medium ${availability.statusColor} inline-flex items-center gap-1.5`}
                                    >
                                        <Icon name="dot" className="w-3 h-3" />
                                        {availability.statusText}
                                    </span>
                                </div>
                                {availability.showFromDate && availability.fromDate && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Available from:</span>
                                        <span className="text-text font-medium">
                                            {availability.fromDate}
                                        </span>
                                    </div>
                                )}
                                {availability.toDate && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Available until:</span>
                                        <span className="text-text font-medium">
                                            {availability.toDate}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lease Period and Start Date Selection */}
                        <div className="mt-6 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
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
                                    min={getMinStartDate(selectedUnit.available_from)}
                                    max={getMaxStartDate(
                                        selectedUnit.available_from,
                                        selectedUnit.available_to
                                    )}
                                    size="sm"
                                    fullWidth
                                />

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

                            {/* Occupancy Toggle */}
                            {canShowDualOccupancy && (
                                <div>
                                    <label className="block text-xs font-medium text-text-muted mb-2">
                                        Occupancy Type
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newOccupancies = {
                                                    ...inclusions.unitOccupancies,
                                                    [selectedUnit.id]: 1,
                                                };
                                                setInclusions((prev) => ({
                                                    ...prev,
                                                    isDualOccupancy: false,
                                                    unitOccupancies: newOccupancies,
                                                }));
                                                // Notify parent if handler provided
                                                onUnitOccupanciesChange?.(newOccupancies);
                                            }}
                                            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
                                                !inclusions.isDualOccupancy
                                                    ? "bg-primary-600 text-white border-primary-600 font-medium"
                                                    : "bg-card text-text border-border hover:border-primary-400"
                                            }`}
                                        >
                                            Single
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newOccupancies = {
                                                    ...inclusions.unitOccupancies,
                                                    [selectedUnit.id]: 2,
                                                };
                                                setInclusions((prev) => ({
                                                    ...prev,
                                                    isDualOccupancy: true,
                                                    unitOccupancies: newOccupancies,
                                                }));
                                                // Notify parent if handler provided
                                                onUnitOccupanciesChange?.(newOccupancies);
                                            }}
                                            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
                                                inclusions.isDualOccupancy
                                                    ? "bg-primary-600 text-white border-primary-600 font-medium"
                                                    : "bg-card text-text border-border hover:border-primary-400"
                                            }`}
                                        >
                                            Dual Occupancy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <div className="flex justify-end gap-2 mb-4">
                            <ShareDropdown
                                propertyTitle={property.title}
                                propertyId={property.id}
                                unitId=""
                            />
                            {likeButton}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 text-text-muted font-medium text-sm">
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
                                setIsApplicationModalOpen(true);
                            }
                        }}
                    >
                        <Icon name="document" className="w-5 h-5 mr-2" />
                        {isAuthenticated ? "Book Now" : "Login to Book"}
                    </Button>
                </div>

                {!isAuthenticated && (
                    <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                        <p className="text-xs text-text">
                            <Icon name="info" className="w-4 h-4 inline mr-1" />
                            Create an account to save properties and apply
                        </p>
                    </div>
                )}
            </div>

            {/* Customize Your Stay */}
            {selectedUnit && (
                <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-text mb-4">Customize your stay</h3>
                    <Inclusions
                        property={property}
                        inclusions={inclusions}
                        onChange={setInclusions}
                        isEntireHome={isEntireHome}
                        effectiveIsDualOccupancy={pricing.isDualOccupancy}
                    />
                </div>
            )}

            {/* Modals */}
            {selectedUnit && (
                <ApplicationModal
                    isOpen={isApplicationModalOpen}
                    onClose={() => setIsApplicationModalOpen(false)}
                    property={property}
                    selectedUnit={selectedUnit}
                    inclusions={{
                        ...inclusions,
                        isDualOccupancy: pricing.isDualOccupancy,
                        selectedStartDate:
                            inclusions.selectedStartDate ||
                            getMinStartDate(selectedUnit.available_from),
                    }}
                    onChange={setInclusions}
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
