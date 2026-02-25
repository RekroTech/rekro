"use client";

import { useState, useMemo, useCallback } from "react";
import type { Unit } from "@/types/db";
import type { Property } from "@/types/property.types";
import { Button, Icon, Input, Select, SegmentedControl } from "@/components/common";
import { useSessionUser } from "@/lib/react-query/hooks/auth";
import { useAuthModal } from "@/contexts";
import { useApplication } from "@/lib/react-query/hooks/application";
import { usePricing, useRentalForm, usePricingSync } from "@/components/Property/hooks";
import { EnquiryForm } from "./EnquiryForm";
import { ShareDropdown } from "./ShareDropdown";
import { UnitLikeButton } from "./UnitLikeButton";
import { ApplicationModal } from "@/components/Application";
import { getAvailabilityInfo, getMaxStartDate, getMinStartDate } from "@/components/Property/utils";
import { LEASE_MONTH_OPTIONS } from "@/components/Property/constants";
import { useProfileCompletion } from "@/contexts";
import { Inclusions } from "../Inclusions/Inclusions";
import { ProfileCompletionModal } from "./ProfileCompletionModal";

interface PropertySidebarProps {
    selectedUnit: Unit;
    property: Property;
    onUnitOccupancyChange?: (unitId: string, occupancy: number) => void;
    dynamicPricing?: Record<string, number>;
}

export function PropertySidebar({
    selectedUnit,
    property,
    onUnitOccupancyChange,
    dynamicPricing,
}: PropertySidebarProps) {
    // Authentication and user data
    const { data: user } = useSessionUser();
    const { openAuthModal } = useAuthModal();
    const isAuthenticated = !!user;

    // Unit type flags
    const isEntireHome = selectedUnit.listing_type === "entire_home";
    const canShowDualOccupancy = !isEntireHome && selectedUnit?.max_occupants === 2;

    // Fetch existing application for this unit
    const { data: application } = useApplication({
        propertyId: property.id,
        unitId: selectedUnit.id,
    });

    // Rental form state management
    const { rentalForm, updateRentalForm } = useRentalForm({
        selectedUnit,
        application,
    });

    // Calculate pricing with memoization
    const pricing = usePricing({
        selectedUnit,
        property,
        rentalForm,
        dynamicPricing,
    });

    // Sync totalRent in rentalForm with calculated pricing
    usePricingSync(
        pricing.totalWeeklyRent,
        rentalForm.totalRent,
        useCallback((totalRent: number) => {
            updateRentalForm({ totalRent });
        }, [updateRentalForm])
    );

    // Modal state management
    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
    const [isProfileCompletionModalOpen, setIsProfileCompletionModalOpen] = useState(false);

    // Profile completion check
    const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();

    // Availability information
    const availability = useMemo(() => getAvailabilityInfo(selectedUnit), [selectedUnit]);

    // Event handlers
    const handleBookNow = useCallback(() => {
        if (!isAuthenticated) {
            openAuthModal(`/property/${property.id}`);
            return;
        }

        if (!isProfileComplete) {
            setIsProfileCompletionModalOpen(true);
            return;
        }

        setIsApplicationModalOpen(true);
    }, [isAuthenticated, isProfileComplete, openAuthModal, property.id]);

    const handleOccupancyChange = useCallback(
        (occupancyType: "single" | "dual") => {
            updateRentalForm({ occupancyType });
            onUnitOccupancyChange?.(
                selectedUnit.id,
                occupancyType === "dual" ? 2 : 1
            );
        },
        [updateRentalForm, onUnitOccupancyChange, selectedUnit.id]
    );

    return (
        <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-lg">
                <div className="mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-text-muted mb-1">
                                {selectedUnit.name}
                            </h3>
                            <p className="text-3xl font-bold text-primary-600">
                                ${pricing.totalWeeklyRent.toFixed(2)}
                                <span className="text-base font-normal text-text-muted">/week</span>
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
                            <UnitLikeButton
                                unitId={selectedUnit.id}
                                propertyId={property.id}
                                isEntireHome={isEntireHome}
                            />
                        </div>
                    </div>

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

                    <div className="mt-6 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="date"
                                id="startDate"
                                label="Preferred Start Date"
                                value={rentalForm.moveInDate}
                                onChange={(e) => updateRentalForm({ moveInDate: e.target.value })}
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
                                value={rentalForm.rentalDuration.toString()}
                                onChange={(e) =>
                                    updateRentalForm({ rentalDuration: Number(e.target.value) })
                                }
                                options={LEASE_MONTH_OPTIONS}
                                size="sm"
                                fullWidth
                            />
                        </div>

                        {canShowDualOccupancy && (
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-2">
                                    Occupancy Type
                                </label>

                                <SegmentedControl<"single" | "dual">
                                    ariaLabel="Occupancy type"
                                    value={rentalForm.occupancyType}
                                    onChange={handleOccupancyChange}
                                    options={[
                                        { value: "single", label: "Single" },
                                        { value: "dual", label: "Dual Occupancy" },
                                    ]}
                                />
                            </div>
                        )}
                    </div>
                </div>

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
                        disabled={isProfileLoading}
                        onClick={handleBookNow}
                    >
                        <Icon name="document" className="w-5 h-5 mr-2" />
                        {user ? "Book Now" : "Login to Book"}
                    </Button>
                </div>

                {!user && (
                    <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                        <p className="text-xs text-text">
                            <Icon name="info" className="w-4 h-4 inline mr-1" />
                            Create an account to save properties and apply
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-lg">
                <h3 className="text-lg font-bold text-text mb-2 sm:mb-4">Customize your stay</h3>
                <Inclusions
                    rentalDuration={rentalForm.rentalDuration}
                    property={property}
                    inclusions={rentalForm.inclusions}
                    onChange={(newInclusions) => updateRentalForm({ inclusions: newInclusions })}
                    isEntireHome={isEntireHome}
                    effectiveOccupancyType={pricing.occupancyType}
                />
            </div>

            <ProfileCompletionModal
                isOpen={isProfileCompletionModalOpen}
                onClose={() => setIsProfileCompletionModalOpen(false)}
            />

            <ApplicationModal
                key={`${selectedUnit?.id || "none"}-${application?.id || "none"}`}
                isOpen={isApplicationModalOpen}
                onClose={() => setIsApplicationModalOpen(false)}
                property={property}
                selectedUnit={selectedUnit}
                rentalForm={rentalForm}
                updateRentalForm={updateRentalForm}
            />

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
