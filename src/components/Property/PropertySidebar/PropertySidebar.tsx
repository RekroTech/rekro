"use client";

import { useState, useMemo, useCallback } from "react";
import type { UnitWithLikes, Property } from "@/types/property.types";
import { useAuthModal, useProfileCompletion } from "@/contexts";
import { useApplication, useSessionUser, useRoles } from "@/lib/hooks";
import { Button, Icon, DatePicker, Select, SegmentedControl } from "@/components/common";
import { Info, Circle, Mail, FileText } from "lucide-react";
import { clsx } from "clsx";
import {
    getAvailabilityInfo,
    Inclusions,
    usePricing,
    useRentalForm,
    usePricingSync,
} from "@/components/Property";
import { LEASE_MONTH_OPTIONS } from "@/components/PropertyForm";
import { ApplicationModal } from "@/components/ApplicationForm";
import { getLocalityString, getMaxStartDate, getMinStartDate } from "@/lib/utils";
import { EnquiryForm } from "./EnquiryForm";
import { ShareDropdown } from "./ShareDropdown";
import { UnitLikeButton } from "./UnitLikeButton";
import { ProfileCompletionModal } from "./ProfileCompletionModal";
import { Tooltip } from "@/components/common/Tooltip";

interface PropertySidebarProps {
    selectedUnit: UnitWithLikes;
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
    const { isAdmin } = useRoles();
    const { openAuthModal } = useAuthModal();
    const isAuthenticated = !!user;
    const streetAddress = property.address?.street || getLocalityString(property.address);

    // Unit type flags
    const isEntireHome = selectedUnit.listing_type === "entire_home";
    const canShowDualOccupancy = !isEntireHome && selectedUnit?.max_occupants === 2;

    // Fetch existing application for this unit
    const { data: application } = useApplication({
        propertyId: property.id,
        unitId: selectedUnit.id,
    });

    // Check if application has been submitted (status is not draft)
    const hasSubmittedApplication = !!(application && application.status !== "draft");

    // Rental form state management
    const { rentalForm, updateRentalForm } = useRentalForm({
        selectedUnit,
        application: application ?? undefined,
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
        useCallback(
            (totalRent: number) => {
                updateRentalForm({ totalRent });
            },
            [updateRentalForm]
        )
    );

    // Modal state management
    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
    const [isProfileCompletionModalOpen, setIsProfileCompletionModalOpen] = useState(false);

    // Profile completion check
    const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();

    // Availability information
    const availability = useMemo(() => getAvailabilityInfo(selectedUnit), [selectedUnit]);
    const isUnitUnavailable = selectedUnit.status !== "active";
    const areRentalFieldsDisabled = hasSubmittedApplication || isUnitUnavailable;
    const areActionButtonsDisabled = isProfileLoading || isUnitUnavailable;

    // Event handlers
    const handleBookNow = useCallback(() => {
        if (isUnitUnavailable) {
            return;
        }

        if (!isAuthenticated) {
            openAuthModal(`/property/${property.id}`);
            return;
        }

        // If application has been submitted, go to applications page
        if (hasSubmittedApplication) {
            window.location.href = "/applications";
            return;
        }

        if (!isProfileComplete) {
            setIsProfileCompletionModalOpen(true);
            return;
        }

        setIsApplicationModalOpen(true);
    }, [
        isUnitUnavailable,
        isAuthenticated,
        hasSubmittedApplication,
        isProfileComplete,
        openAuthModal,
        property.id,
    ]);

    const handleOccupancyChange = useCallback(
        (occupancyType: "single" | "dual") => {
            if (areRentalFieldsDisabled) {
                return;
            }

            updateRentalForm({ occupancyType });
            onUnitOccupancyChange?.(selectedUnit.id, occupancyType === "dual" ? 2 : 1);
        },
        [areRentalFieldsDisabled, updateRentalForm, onUnitOccupancyChange, selectedUnit.id]
    );

    return (
        <div className="space-y-4">
            {isAdmin && property.price !== null && property.price !== undefined && (
                <div className="bg-card border border-warning-500/40 rounded-lg p-4 sm:p-6 shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-wide text-warning-600 mb-2">
                        Base Rent
                    </p>
                    <p className="text-3xl font-bold text-warning-600">
                        ${property.price.toFixed(2)}
                        <span className="text-base font-normal text-text-muted">/week</span>
                    </p>
                    <p className="text-sm text-text-muted mt-1">Bond: ${(property.price * 4).toFixed(2)}</p>
                </div>
            )}

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
                            <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                                Bond: ${pricing.bond.toFixed(2)}
                                <Tooltip
                                    content={
                                        <span>
                                            A bond (security deposit) equal to 4 weeks of rent, is held by reKro and returned at the end of your tenancy,
                                            provided there is no damage or outstanding rent.
                                        </span>
                                    }
                                    position="top"
                                    maxWidth="max-w-64"
                                >
                                    <Icon
                                        icon={Info}
                                        size={14}
                                        className="text-text-muted/70 cursor-help hover:text-primary-500 transition-colors"
                                    />
                                </Tooltip>
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <ShareDropdown
                                propertyAddress={streetAddress}
                                propertyId={property.id}
                                unitId={selectedUnit.id}
                            />
                            <UnitLikeButton
                                unitId={selectedUnit.id}
                                propertyId={property.id}
                                isLiked={selectedUnit.isLiked ?? false}
                                likesCount={selectedUnit.likesCount ?? 0}
                                isEntireHome={isEntireHome}
                            />
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-surface-subtle rounded-lg border border-border">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Status:</span>
                                <span
                                    className={clsx(
                                        "font-medium inline-flex items-center gap-1.5",
                                        availability.statusColor
                                    )}
                                >
                                    <Icon icon={Circle} size={12} />
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="min-w-0">
                                <DatePicker
                                    id="startDate"
                                    label="Preferred Start Date"
                                    value={rentalForm.moveInDate}
                                    onChange={(value) => updateRentalForm({ moveInDate: value })}
                                    min={getMinStartDate(selectedUnit.available_from)}
                                    max={getMaxStartDate(
                                        selectedUnit.available_from,
                                        selectedUnit.available_to
                                    )}
                                    size="sm"
                                    fullWidth
                                    disabled={areRentalFieldsDisabled}
                                />
                            </div>

                            <div className="min-w-0">
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
                                    disabled={areRentalFieldsDisabled}
                                />
                            </div>
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
                                    disabled={areRentalFieldsDisabled}
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
                        disabled={areActionButtonsDisabled}
                        onClick={() => setIsEnquiryModalOpen(true)}
                    >
                        <Icon icon={Mail} size={20} className="mr-2" />
                        Send Enquiry
                    </Button>

                    <Button
                        variant="primary"
                        className="w-full"
                        disabled={areActionButtonsDisabled}
                        onClick={handleBookNow}
                    >
                        <Icon icon={FileText} size={20} className="mr-2" />
                        {hasSubmittedApplication
                            ? "View Application"
                            : "Start Application"}
                    </Button>
                </div>

                {!user && (
                    <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                        <p className="text-xs text-text">
                            <Icon icon={Info} size={16} className="inline mr-1" />
                            Create an account to save properties and apply
                        </p>
                    </div>
                )}
            </div>

            {!isUnitUnavailable && (
                <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-text mb-2 sm:mb-4">Customize your stay</h3>
                    <Inclusions
                        rentalDuration={rentalForm.rentalDuration}
                        property={property}
                        inclusions={rentalForm.inclusions}
                        onChange={(newInclusions) => updateRentalForm({ inclusions: newInclusions })}
                        isEntireHome={isEntireHome}
                        effectiveOccupancyType={pricing.occupancyType}
                        disabled={areRentalFieldsDisabled}
                    />
                </div>
            )}

            <ProfileCompletionModal
                isOpen={isProfileCompletionModalOpen && !isUnitUnavailable}
                onClose={() => setIsProfileCompletionModalOpen(false)}
            />

            <ApplicationModal
                key={`${selectedUnit?.id || "none"}-${application?.id || "none"}`}
                isOpen={isApplicationModalOpen && !isUnitUnavailable}
                onClose={() => setIsApplicationModalOpen(false)}
                property={property}
                selectedUnit={selectedUnit}
                rentalForm={rentalForm}
                updateRentalForm={updateRentalForm}
            />

            <EnquiryForm
                isOpen={isEnquiryModalOpen && !isUnitUnavailable}
                onClose={() => setIsEnquiryModalOpen(false)}
                unitId={selectedUnit?.id}
            />
        </div>
    );
}
