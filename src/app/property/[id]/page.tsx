"use client";

import { useProperty, useUserLikes } from "@/lib/react-query/hooks/property";
import { Loader, Button, BackButton } from "@/components/common";
import {
    PropertyHeader,
    UnitsSelector,
    ImageGallery,
    PropertyAmenities,
    PropertySidebar,
    LikedUsersCarousal,
} from "@/components/Property/PropertyDetail";
import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPropertyFileUrls } from "@/services/storage.service";
import { Unit } from "@/types/db";
import { updateRoomRentsOnOccupancySelection } from "@/components/Property/pricing";
import { ProfileCompletionProvider } from "@/contexts";

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;

    // Fetch property data (no longer includes likes)
    const { data: property, isLoading, error } = useProperty(propertyId);

    // Fetch users who liked any unit in this property
    const { data: usersWhoLiked, isLoading: isLoadingLikes } = useUserLikes(propertyId);

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

    // Track unit occupancies for dynamic pricing
    const [unitOccupancies, setUnitOccupancies] = useState<Record<string, number>>({});

    const units = useMemo(() => property?.units || [], [property?.units]);

    const selectedUnit = useMemo(() => {
        if (units.length === 0) return null;
        const found = units.find((u: Unit) => u.id === selectedUnitId);
        return found ?? units[0] ?? null;
    }, [units, selectedUnitId]);

    // Initialize selectedUnitId and unitOccupancies when units are available
    useEffect(() => {
        if (units.length > 0) {
            const firstUnit = units[0];
            if (firstUnit && selectedUnitId !== firstUnit.id) {
                requestAnimationFrame(() => {
                    setSelectedUnitId(firstUnit.id);
                    setSelectedImageIndex(0);
                });
            }
        } else if (selectedUnitId !== null) {
            requestAnimationFrame(() => {
                setSelectedUnitId(null);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [units, propertyId]); // selectedUnitId intentionally excluded to prevent infinite loop

    // Calculate dynamic pricing for all rooms based on current occupancy selections
    // Only apply dynamic pricing when dual occupancy is actually selected
    const dynamicPricing = useMemo(() => {
        if (!property || !property.units || property.units.length <= 1) {
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

    // Convert storage paths to URLs
    const propertyMedia =
        property.images && property.images.length > 0
            ? getPropertyFileUrls(property.images, propertyId)
            : ["/window.svg"];

    const handleUnitSelect = (unitId: string) => {
        setSelectedUnitId(unitId);
        setSelectedImageIndex(0);
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
                        <ImageGallery
                            images={propertyMedia}
                            title={property.title}
                            selectedIndex={selectedImageIndex}
                            onIndexChange={setSelectedImageIndex}
                        />

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
                        <div className="lg:hidden mt-4">
                            <PropertySidebar
                                selectedUnit={selectedUnit}
                                property={property}
                                unitOccupancies={unitOccupancies}
                                onUnitOccupanciesChange={setUnitOccupancies}
                            />
                        </div>

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

                    {/* Sidebar - Hidden on mobile (shown above), visible on desktop */}
                    <div className="hidden lg:block lg:col-span-1 min-w-0">
                        <PropertySidebar
                            selectedUnit={selectedUnit}
                            property={property}
                            unitOccupancies={unitOccupancies}
                            onUnitOccupanciesChange={setUnitOccupancies}
                        />
                    </div>
                </div>

                {/* Users Who Liked Carousel */}
                {!isLoadingLikes && usersWhoLiked && usersWhoLiked.length > 0 && (
                    <div className="mt-4 sm:mt-12 pt-4 sm:pt-12 border-t border-border">
                        <LikedUsersCarousal users={usersWhoLiked} />
                    </div>
                )}
            </main>
        </ProfileCompletionProvider>
    );
}
