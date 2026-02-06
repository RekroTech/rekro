"use client";

import { useUnitLike, useToggleUnitLike, useProperty } from "@/lib/react-query/hooks/property";
import { Loader, Button, Icon } from "@/components/common";
import {
    PropertyHeader,
    UnitsSelector,
    ImageGallery,
    ImageThumbnails,
    PropertyDescription,
    PropertyAmenities,
    PropertySidebar,
} from "@/components/Property/PropertyDetail";
import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPropertyFileUrls } from "@/services/storage.service";
import { Unit } from "@/types/db";

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;

    const { data: property, isLoading, error } = useProperty(propertyId);

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

    const units = useMemo(() => property?.units || [], [property?.units]);

    // Determine if this is an entire home listing (all units are entire_home type)
    const isEntireHome = useMemo(() => {
        if (units.length === 0) return false;
        return units.every((unit: Unit) => unit.listing_type === "entire_home");
    }, [units]);

    // Show units section for all room listings (shared houses); never for entire_home
    const showUnitsSelector = !isEntireHome && units.length > 0;

    // Initialize selectedUnitId based on units or propertyId changes
    useEffect(() => {
        if (units.length > 0 && !selectedUnitId) {
            const firstUnit = units[0];
            if (firstUnit) {
                // Use requestAnimationFrame to avoid cascading renders
                requestAnimationFrame(() => {
                    setSelectedUnitId(firstUnit.id);
                    setSelectedImageIndex(0);
                });
            }
        }
    }, [units, selectedUnitId]);

    // Reset state when property changes
    useEffect(() => {
        requestAnimationFrame(() => {
            setSelectedUnitId(null);
            setSelectedImageIndex(0);
        });
    }, [propertyId]);

    const selectedUnit = useMemo(() => {
        if (units.length === 0) return null;
        const found = units.find((u: Unit) => u.id === selectedUnitId);
        return found ?? units[0] ?? null;
    }, [units, selectedUnitId]);

    const activeUnitId = selectedUnit?.id || "";

    const { data: isLiked = false } = useUnitLike(activeUnitId);
    const toggleLikeMutation = useToggleUnitLike();

    const handleToggleLike = async () => {
        if (!activeUnitId) return;
        try {
            await toggleLikeMutation.mutateAsync(activeUnitId);
        } catch (error) {
            console.error("Error toggling unit like:", error);
        }
    };

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
                    <Button variant="primary" onClick={() => router.push("/dashboard")}>
                        Back to Dashboard
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
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors mb-6 cursor-pointer"
            >
                <Icon name="chevron-left" className="w-5 h-5" />
                Back
            </button>

            {/* Property Header */}
            <PropertyHeader property={property} />

            {/* Main Grid: Image Gallery (2/3) + Sidebar (1/3) */}
            <div className="grid gap-6 mb-8 grid-cols-3">
                {/* Image Gallery - 2/3 width */}
                <div className="col-span-2">
                    <ImageGallery
                        images={propertyMedia}
                        title={property.title}
                        selectedIndex={selectedImageIndex}
                        onIndexChange={setSelectedImageIndex}
                    />

                    <ImageThumbnails
                        images={propertyMedia}
                        title={property.title}
                        selectedIndex={selectedImageIndex}
                        onSelect={setSelectedImageIndex}
                    />

                    {/* Units Section */}
                    {showUnitsSelector && (
                        <UnitsSelector
                            units={units}
                            selectedUnitId={selectedUnitId}
                            onUnitSelect={handleUnitSelect}
                        />
                    )}
                    {/* Content */}
                    <div className="space-y-8 mt-8">
                        <PropertyDescription description={property.description} />
                        <PropertyAmenities amenities={property.amenities} />
                    </div>
                </div>

                {/* Sidebar */}
                <PropertySidebar
                    selectedUnit={selectedUnit}
                    isEntireHome={isEntireHome}
                    isLiked={isLiked}
                    onToggleLike={handleToggleLike}
                    isPending={toggleLikeMutation.isPending}
                    property={property}
                />
            </div>
        </main>
    );
}
