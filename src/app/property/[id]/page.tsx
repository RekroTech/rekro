"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProfileCompletionProvider } from "@/contexts";
import { getPropertyFileUrls } from "@/lib/services";
import { useProperty, useProfile } from "@/lib/hooks";
import { useMediaQuery } from "@/hooks";
import { Loader, Button, BackButton } from "@/components/common";
import {
    PropertyHeader,
    UnitsSelector,
    ImageGallery,
    ImageGalleryMobile,
    PropertyAmenities,
    PropertySidebar,
    LikedUsersCarousal,
    DiscoverabilityPrompt,
} from "@/components/Property";
import { updateRoomRentsOnOccupancySelection } from "@/components/Property/utils/pricing";

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const { data: userProfile } = useProfile();

    const { data: property, isLoading, error } = useProperty(propertyId);

    const [selectedUnitId, setSelectedUnitId] = useState<string>("");
    const [unitOccupancies, setUnitOccupancies] = useState<Record<string, number>>({});

    // Initialize selectedUnitId when units are available (must be before early returns)
    useEffect(() => {
        if (property?.units && property.units.length > 0 && !selectedUnitId) {
            setSelectedUnitId(property.units[0]!.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [property?.units, propertyId]); // selectedUnitId intentionally excluded to prevent infinite loop

    // Calculate dynamic pricing for all rooms based on current occupancy selections
    // Only apply dynamic pricing when dual occupancy is actually selected
    const dynamicPricing = useMemo(() => {
        if (!property?.units || property.units.length <= 1) {
            return undefined; // No dynamic pricing for single unit or entire home
        }

        const isRoomListing = property.units.some((u) => u.listing_type === "room");
        if (!isRoomListing) return undefined;

        // Check if any ROOM unit has dual occupancy selected (exclude entire_home)
        const hasAnyDualOccupancy = property.units.some(
            (unit) => unit.listing_type === "room" && unitOccupancies[unit.id] === 2
        );

        // Only calculate dynamic pricing if dual occupancy is selected somewhere
        if (!hasAnyDualOccupancy) {
            return undefined; // Use default unit.price values
        }

        // Only include room type units in the calculation
        const rooms = property.units
            .filter((u) => u.listing_type === "room")
            .map((unit) => ({
                id: unit.id,
                maxCapacity: unit.max_occupants || 1,
                selectedOccupancy: unitOccupancies[unit.id] || 1,
            }));

        const result = updateRoomRentsOnOccupancySelection(
            property.price || 0,
            rooms,
            property.furnished || false
        );

        return result.roomRentsById;
    }, [property, unitOccupancies]);

    // Early returns for loading/error states - AFTER all hooks
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader size="lg" />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Property Not Found</h1>
                    <p className="text-text-muted mb-6">
                        The property you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Button variant="primary" onClick={() => router.push("/")}>
                        Back to Properties
                    </Button>
                </div>
            </div>
        );
    }

    // Defensive: properties must have at least one unit for this page
    if (!property.units || property.units.length === 0) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        No units available
                    </h1>
                    <p className="text-text-muted mb-6">
                        This property doesn&apos;t have any rentable units configured.
                    </p>
                    <Button variant="primary" onClick={() => router.push("/")}>
                        Back to Properties
                    </Button>
                </div>
            </div>
        );
    }

    // After all checks, property and units are guaranteed to exist
    const units = property.units;
    const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? units[0]!;

    // Convert storage paths to URLs
    const propertyMedia =
        property.images && property.images.length > 0
            ? getPropertyFileUrls(property.images, propertyId)
            : ["/window.svg"];

    const handleUnitSelect = (unitId: string) => {
        setSelectedUnitId(unitId);
    };

    return (
        <ProfileCompletionProvider>
            <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 lg:px-8 lg:py-8 overflow-x-hidden">
                {/* Back Button */}
                <BackButton className="mb-4 sm:mb-6" />

                {/* Property Header */}
                <PropertyHeader property={property} selectedUnit={selectedUnit} />

                {/* Main Grid: Image Gallery + Content (stacked on mobile, 2/3 on desktop) + Sidebar (1/3 on desktop) */}
                <div className="grid gap-4 sm:gap-6 mb-8 lg:grid-cols-3">
                    {/* Image Gallery & Content - Full width on mobile, 2/3 on desktop */}
                    <div className="lg:col-span-2 min-w-0">
                        {/* Mobile Image Gallery - Embla Carousel */}
                        <div className="md:hidden aspect-video rounded-lg overflow-hidden mb-2 sm:mb-4">
                            <ImageGalleryMobile
                                images={propertyMedia}
                                title={property.title}
                            />
                        </div>

                        {/* Desktop Image Gallery */}
                        <div className="hidden md:block">
                            <ImageGallery
                                images={propertyMedia}
                                title={property.title}
                            />
                        </div>

                        {/* Units Section */}
                        {units.length > 1 && (
                            <UnitsSelector
                                units={units}
                                selectedUnitId={selectedUnitId}
                                onUnitSelect={handleUnitSelect}
                                dynamicPricing={dynamicPricing}
                            />
                        )}

                        {/* Sidebar on mobile - Show after units, before description */}
                        {!isDesktop && (
                            <div className="mt-4">
                                <PropertySidebar
                                    selectedUnit={selectedUnit}
                                    property={property}
                                    dynamicPricing={dynamicPricing}
                                    onUnitOccupancyChange={(unitId, occupancy) =>
                                        setUnitOccupancies((prev) => ({ ...prev, [unitId]: occupancy }))
                                    }
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div className="px-2 sm:px-0 space-y-6 sm:space-y-8 mt-6 sm:mt-8">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-text mb-3 sm:mb-4">
                                    About the property
                                </h2>
                                <p className="text-sm sm:text-base text-text-muted leading-relaxed whitespace-pre-line">
                                    {property.description || "No description available."}
                                </p>
                            </div>
                            <PropertyAmenities amenities={property.amenities} />
                        </div>
                    </div>

                    {/* Sidebar - Desktop only */}
                    {isDesktop && (
                        <div className="col-span-1 min-w-0">
                            <PropertySidebar
                                selectedUnit={selectedUnit}
                                property={property}
                                dynamicPricing={dynamicPricing}
                                onUnitOccupancyChange={(unitId, occupancy) =>
                                    setUnitOccupancies((prev) => ({ ...prev, [unitId]: occupancy }))
                                }
                            />
                        </div>
                    )}
                </div>

                {/* Users Who Liked Carousel - Only visible if viewing user is discoverable (reciprocal privacy) */}
                {userProfile?.discoverable ? (
                    <div className="my-4 sm:my-12">
                        <LikedUsersCarousal propertyId={propertyId} />
                    </div>
                ) : (
                    <DiscoverabilityPrompt />
                )}
            </main>
        </ProfileCompletionProvider>
    );
}
