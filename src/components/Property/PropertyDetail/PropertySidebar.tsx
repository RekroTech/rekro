"use client";

import { useState } from "react";
import { Button } from "@/components/common";
import { Property, Unit } from "@/types/db";
import { EnquiryModal } from "./EnquiryModal";
import { ApplicationModal } from "./ApplicationModal";
import { ShareDropdown } from "./ShareDropdown";
import { useUnitAvailability } from "@/lib/react-query/hooks/useUnits";

interface PropertySidebarProps {
    selectedUnit: Unit | null;
    isEntireHome: boolean;
    isLiked: boolean;
    onToggleLike: () => void;
    isPending: boolean;
    property: Property;
}

export function PropertySidebar({
    selectedUnit,
    isEntireHome,
    isLiked,
    onToggleLike,
    isPending,
    property,
}: PropertySidebarProps) {
    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

    // Fetch availability data for the selected unit
    const { data: availability } = useUnitAvailability(selectedUnit?.id || "");

    // Format availability dates
    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const availableFromFormatted = formatDate(availability?.available_from || null);
    const availableToFormatted = formatDate(availability?.available_to || null);

    // Determine availability status
    const getAvailabilityStatus = () => {
        if (!availability) return { text: "Availability unknown", color: "text-gray-500" };

        if (!availability.is_available) {
            return { text: "Not currently available", color: "text-red-600" };
        }

        const now = new Date();
        const availableFrom = availability.available_from
            ? new Date(availability.available_from)
            : null;

        if (availableFrom && availableFrom > now) {
            return {
                text: `Available from ${availableFromFormatted}`,
                color: "text-yellow-600",
            };
        }

        return { text: "Available now", color: "text-green-600" };
    };

    const availabilityStatus = getAvailabilityStatus();

    return (
        <div className="col-span-1">
            <div className="bg-white border border-border rounded-lg p-6 shadow-lg sticky top-4">
                {/* Like and Share Buttons - Top Right */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <ShareDropdown
                        propertyTitle={property.title}
                        propertyId={property.id}
                        unitId={selectedUnit?.id || ""}
                    />
                    <button
                        onClick={onToggleLike}
                        disabled={isPending}
                        className={`p-2 rounded-full transition-all ${
                            isLiked
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500"
                        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                        aria-label={
                            isLiked
                                ? `Unsave ${isEntireHome ? "property" : "room"}`
                                : `Save ${isEntireHome ? "property" : "room"}`
                        }
                    >
                        <svg
                            className="w-5 h-5"
                            fill={isLiked ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth={isLiked ? 0 : 2}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </button>
                </div>

                {selectedUnit && (
                    <div className="mb-4 pb-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-text-muted mb-1">
                            {isEntireHome ? "Price" : "Room Price"}
                        </h3>
                        <p className="text-3xl font-bold text-primary-600">
                            ${selectedUnit.price_per_week}
                            <span className="text-base font-normal text-text-muted">/week</span>
                        </p>
                        {selectedUnit.bond_amount && (
                            <p className="text-sm text-text-muted mt-1">
                                Bond: ${selectedUnit.bond_amount}
                            </p>
                        )}

                        {/* Availability Information */}
                        {availability && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-muted">Status:</span>
                                        <span
                                            className={`font-medium ${availabilityStatus.color} inline-flex items-center gap-1.5`}
                                        >
                                            <svg
                                                className="w-3 h-3"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <circle cx="10" cy="10" r="3" />
                                            </svg>
                                            {availability.is_available
                                                ? "Available"
                                                : "Not Available"}
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
                                            <span className="text-text-muted">
                                                Available until:
                                            </span>
                                            <span className="text-text font-medium">
                                                {availableToFormatted}
                                            </span>
                                        </div>
                                    )}
                                    {availability.notes && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <p className="text-text-muted text-xs mb-1">Notes:</p>
                                            <p className="text-text text-xs">
                                                {availability.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {!availability && (
                            <div className="mt-3 flex items-center gap-2">
                                <div className="inline-flex items-center gap-1.5 text-gray-500 font-medium text-sm">
                                    <svg
                                        className="w-4 h-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <circle cx="10" cy="10" r="3" />
                                    </svg>
                                    Availability will be updated
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <h3 className="text-xl font-bold text-text mb-4">Interested?</h3>
                <p className="text-text-muted mb-6">
                    Get in touch to kow more or apply now to secure this{" "}
                    {isEntireHome ? "property" : "room"}.
                </p>

                <div className="space-y-3">
                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => setIsEnquiryModalOpen(true)}
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        Enquire Now
                    </Button>

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setIsApplicationModalOpen(true)}
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Apply
                    </Button>
                </div>

                {/* Details */}
                <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-sm font-semibold text-text mb-3">
                        {isEntireHome ? "Property" : "Room"} Details
                    </h4>

                    <div className="space-y-2 text-sm">
                        {selectedUnit && (
                            <>
                                {selectedUnit.max_occupants && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Max Occupants:</span>
                                        <span className="text-text font-medium">
                                            {selectedUnit.max_occupants}
                                        </span>
                                    </div>
                                )}

                                {selectedUnit.size_sqm && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Size:</span>
                                        <span className="text-text font-medium">
                                            {selectedUnit.size_sqm} sqm
                                        </span>
                                    </div>
                                )}

                                {selectedUnit.bills_included !== null && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Bills Included:</span>
                                        <span className="text-text font-medium">
                                            {selectedUnit.bills_included ? "Yes" : "No"}
                                        </span>
                                    </div>
                                )}

                                {(selectedUnit.min_lease_weeks || selectedUnit.max_lease_weeks) && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Lease Term:</span>
                                        <span className="text-text font-medium">
                                            {selectedUnit.min_lease_weeks &&
                                                `${selectedUnit.min_lease_weeks}w`}
                                            {selectedUnit.min_lease_weeks &&
                                                selectedUnit.max_lease_weeks &&
                                                " - "}
                                            {selectedUnit.max_lease_weeks &&
                                                `${selectedUnit.max_lease_weeks}w`}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {property.property_type && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Property Type:</span>
                                <span className="text-text font-medium capitalize">
                                    {property.property_type}
                                </span>
                            </div>
                        )}

                        {property.furnished !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Furnished:</span>
                                <span className="text-text font-medium">
                                    {property.furnished ? "Yes" : "No"}
                                </span>
                            </div>
                        )}

                        {property.created_at && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Listed:</span>
                                <span className="text-text font-medium">
                                    {new Date(property.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EnquiryModal
                isOpen={isEnquiryModalOpen}
                onClose={() => setIsEnquiryModalOpen(false)}
                propertyTitle={property.title}
                propertyId={property.id}
                unitId={selectedUnit?.id}
                isEntireHome={isEntireHome}
            />

            <ApplicationModal
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
